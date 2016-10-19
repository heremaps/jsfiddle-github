//initialize the platform
var platform = new H.service.Platform({
    app_id: 'DemoAppId01082013GAL',
    app_code: 'AJKnXv84fjrb0KIHawS0Tg',
    useCIT: true,
    useHTTPS: true
});

//instantiate datalens service
var service = new H.datalens.Service();
service.configure(
    'DemoAppId01082013GAL',
    'AJKnXv84fjrb0KIHawS0Tg',
    true,                   // useHTTPS
    false,                  // useCIT
    'https://api.here.com'  // baseUrl
);

//define pixelRatio (1 or 2)
var pixelRatio = devicePixelRatio > 1 ? 2 : 1;

var baseLayer = platform.getMapTileService({type: 'base'}).createTileLayer(
    'maptile',
    'reduced.day',
    256 * pixelRatio, //take bigger tiles for retina
    'png'
);

//instantiate (and display) a map
var mapHolder = document.getElementById('map');

var map = new H.Map(
    mapHolder,
    baseLayer,
    {
        pixelRatio: pixelRatio,
        center:  new H.geo.Point(40.769832, -73.974726),
        zoom: 14
    }
);

//set min zoom level
map.getBaseLayer().setMin(13);

//enable map interactivity
var mapEvents = new H.mapevents.MapEvents(map);
new H.mapevents.Behavior(mapEvents);

//instantiate datalens tile provider
var TILED_QUERY = '35fa6264de354047aa4cc6043fd2eeda';
var provider = new H.datalens.QueryTileProvider(
    service,
    {
        queryId: TILED_QUERY,
        tileParamNames: {x: 'x', y: 'y', z: 'z'}
    }
);

//connect UI to provider
document.addEventListener('change', function(e) {
    if (e.target.name === 'technology') {
        var inputs = document.querySelectorAll('input[name=technology]');
        var filterValue = [];
        [].forEach.call(inputs, function(input) {
            if (input.checked) {
                filterValue.push(input.value);
            }
        });

        //update query dynamic parameters
        provider.setQueryParams({
            technology_filter: filterValue
        });
        provider.reload();
    }
});

//helpers for drawing antenna icons
var CHEVRON_ANGLE = 39;
var TAN_OF_CHEVRON_ANGLE = Math.tan(CHEVRON_ANGLE  * Math.PI / 180);
function getChevronPath(magnitude, width) {
    var upperY;
    var lowerY;
    var operations;
    var x = width / 2;
    var offset = x  * TAN_OF_CHEVRON_ANGLE;
    lowerY = -offset;
    upperY = magnitude - offset;

    //  5     1
    //  ┃╲   ╱┃
    //  ┃  0  ┃   0 → x (width)
    //  ┃     ┃   ↓
    //  ┃     ┃   y (magnitude)
    //  ┃     ┃
    //  ┃     ┃
    //  4     2
    //   ╲   ╱
    //    ╲ ╱
    //     3

    operations =
    [
        'M', 0, 0,        // 0 base
        'L', x, lowerY,   // 1
        'L', x, upperY,   // 2
        'L', 0, magnitude,// 3 tip
        'L', -x, upperY,  // 4
        'L', -x, lowerY,  // 5
        'z'
    ];

    return operations.join(' ');
}

var getLength = d3.scaleLinear()
.domain([13, 19]) //zoom
.range([15, 45]); //size

var TECHNOLOGY_COLORS = {
    '2G': '#fde604',
    '3G': '#ff0000',
    '4G': '#08ea94'
};
function getMarkerIcon(rows, zoom) {
    var rowsByAzimuth = rows.reduce(function(rowsByAzimuth, row) {
        rowsByAzimuth[row.azimuth] = rowsByAzimuth[row.azimuth] || [];
        rowsByAzimuth[row.azimuth].push(row);
        return rowsByAzimuth;
    }, {});
    var stackRows;
    var segmentLength;
    var azimuth;
    var translateY;
    var stacks = [];
    var size = 75 * pixelRatio;
    for (azimuth in rowsByAzimuth) {
        stackRows = rowsByAzimuth[azimuth];
        segmentLength = getLength(zoom) / stackRows.length;
        translateY = 4; // at the beginning offset equals the length of the inner circle's radius
        stackRows.forEach(function(row) {
            //for each stack create chevron path
            var path = [
                'path',
                {
                    d: getChevronPath(segmentLength, 7, false),
                    fill: TECHNOLOGY_COLORS[row.technology],
                    stroke: 'black',
                    transform: 'rotate(' + azimuth + ')' +
                    'translate(0,' + translateY + ')'
                }
            ];
            translateY = translateY + segmentLength;
            stacks.push(path);
        });
    }
    return H.datalens.ObjectLayer.createIcon(
        [
            'svg',
            {
                viewBox: '-50 -50 100 100'
            }
        ].concat(stacks).concat([
            [
                'circle',
                {
                    r: 4,
                    fill: 'white',
                    stroke: 'black'
                }
            ]
        ]), {size: size}
    );
}

//Create directional(outdoor) antennas layer
var layer = new H.datalens.ObjectLayer(
    provider,
    {
        //use clustering to collect antennas in same position
        clustering: {
            rowToDataPoint: function(row) {
                return new H.clustering.DataPoint(
                    row.lat, row.lon, 1
                );
            },
            options: {
                strategy: H.clustering.Provider.Strategy.GRID,
                eps: 4 //cluster only points in same position
            }
        },

        //creates marker for each cluster
        rowToMapObject: function(cluster) {
            var marker = new H.map.Marker(
                cluster.getPosition()
            );
            return marker;
        },

        //creates style cluster icon
        rowToStyle: function(cluster, zoom) {
            var rows = [];
            if (cluster.isCluster()) {
                //collect rows from cluster
                cluster.forEachDataPoint(function(p) {
                    rows.push(p.getData());
                });
            } else {
                //noise point
                rows = [cluster.getData()];
            }
            return {
                icon: getMarkerIcon(rows, zoom)
            };
        }
    }
);

//add layer on map
map.addLayer(layer);

/**
 * This software contains open source components pursuant to the following licenses:
 * https://d3js.org Version 4.0.0-alpha.50.
 * Copyright 2016 Mike Bostock. License BSD-3-Clause
 */

/**
 * Boilerplate
 */

//add interactive legend
var legendHolder = document.createElement('div');
legendHolder.className = 'antenna-legend';
legendHolder.innerHTML = [
    '<div class="heading">Technologies</div>'
].concat(
    Object.keys(TECHNOLOGY_COLORS).map(function(technology) {
        return (
        '<div>' +
            '<input type="checkbox" value="' +
            technology +
            '" name="technology" id="' +
            technology +
            '" checked/>' +
            '<label for="' + technology + '">' +
                '<span class="offset" style="color: ' +
                TECHNOLOGY_COLORS[technology] +
                '">' +
                technology +
                '</span>' +
            '</label>' +
        '</div>');
    }).join('')
);
map.getElement().appendChild(legendHolder);


$('head').append('<link rel="stylesheet" href="https://js.api.here.com/v3/3.0/mapsjs-ui.css" type="text/css" />');
