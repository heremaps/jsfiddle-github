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

//add base map
var baseLayer = platform.getMapTileService({type: 'base'}).createTileLayer(
    'maptile',
    'reduced.day',
    256 * pixelRatio, //take bigger tiles for retina
    'png'
);

//display a map
var mapHolder = document.getElementById('map');
var map = new H.Map(
    mapHolder,
    baseLayer,
    {
        pixelRatio: pixelRatio,
        center:  new H.geo.Point(40.769832, -73.974726),
        zoom: 13
    }
);

//add interactivity to map
new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

//initialize datalens provider
var TILED_QUERY = 'fd93e6f122a8456dace65ad4f33673bd';
var queryProvider = new H.datalens.QueryTileProvider(
    service,
    {
        queryId: TILED_QUERY,
        tileParamNames: {x: 'x', y: 'y', z: 'z'}
    }
);

//connect UI to provider
document.addEventListener('click', function(e) {
    var filterValue = e.target.innerText;
    if (e.target.className === 'dropdown__option') {
        //update dynamic parameter
        queryProvider.setQueryParams({
            technology_filter: filterValue
        });
        queryProvider.reload();
    }
});

var layer = new H.datalens.ObjectLayer(
    queryProvider,
    {
        clustering: {
            rowToDataPoint: function(row) {
                return new H.clustering.DataPoint(
                    row.lat, row.lon, 1
                );
            },
            options: function(zoom) {
                return {
                    strategy: H.clustering.Provider.Strategy.DYNAMICGRID,
                    eps: 50,
                    //after zoom 16 show do not cluster
                    minWeight: zoom < 16 ? 2 : Infinity
                };
            }
        },
        //accepts data row and returns map object
        rowToMapObject: function(cluster) {
            return new H.map.Marker(
                cluster.getPosition()
            );
        },
        rowToStyle: function(cluster, zoom) {
            var icon;
            if (cluster.isCluster()) {
                //cluster of antennas
                icon = getClusterStyle(cluster, zoom);
            } else {
                //noise point
                icon = getNoisePointStyle(cluster, zoom);
            }
            return {icon: icon};
        }
    }
);

//put layers on the map
map.addLayer(layer);

var PROVIDER_COLORS = {
    '1': '#23a38f',
    '2': '#ffd480',
    '3': '#ff5346',
    '4': '#0092b3'
};
var getSize = d3.scaleLinear()
    .domain([14, 19]) //zoom
    .range([50, 75]); //size
/**
 * @param {H.clustering.INoisePoint} noisePoint
 * @param {number} zoom
 * @returns {H.datalens.Icon}
 */
function getNoisePointStyle(noisePoint, zoom) {
    var provider = noisePoint.getData().provider;
    return H.datalens.ObjectLayer.createIcon(
        [
            'svg',
            {
                viewBox: '-20 -20 40 40'
            },
            [
                'circle',
                {
                    r: 6,
                    fill: PROVIDER_COLORS[provider],
                    stroke: '#000000'
                }
            ]
        ], {size: getSize(zoom) * pixelRatio}
    );
}

/**
 * @param {H.clustering.ICluster} cluster
 * @param {number} zoom
 * @returns {H.datalens.Icon}
 */
function getClusterStyle(cluster, zoom) {
    var providers =  getClusterProviders(cluster);
    var startAngle = 0;
    var chunkAngle = 2 * Math.PI / cluster.getWeight();
    var endAngle = 0;
    var svg = ['svg',
    {
        viewBox: '-20 -20 40 40'
    }];
    svg.push(
        //inner circle
        [
            'circle',
            {
                r: 14
            }
        ],
        //label
        [
            'text',
            {
                x: 0,
                y: 5,
                fontFamily: 'sans-serif',
                fontWeight: 100,
                fontSize: 15,
                textAnchor: 'middle',
                fill: 'white'
            },
            String(cluster.getWeight())
        ]
    );

    // Outer circle represents different antennas.
    // Number of slices represents the the number of different providers
    for (var provider in providers)  {
        // slice is just one element of a cluster and
        // providers obj has providers and count of a provider in cluster
        endAngle = endAngle + chunkAngle * providers[provider];
        svg.push([
            'path',
            {
                d: d3.arc()({
                    innerRadius: 14,
                    outerRadius: 19,
                    startAngle: startAngle,
                    endAngle: endAngle
                }),
                fill: PROVIDER_COLORS[provider] ,
                fillOpacity: 0.7,
                stroke: 'rgba(0, 0, 0, 0.3)'
            }]
        );
        startAngle = endAngle;
    }
    return H.datalens.ObjectLayer.createIcon(
        svg, {size:  getSize(zoom) * pixelRatio}
    );
}

/**
 * @param {H.clustering.ICluster} cluster
 * @returns {Object.<string, number>} number of antennas by provider
 */
function getClusterProviders(cluster) {
    var providers = {};
    cluster.forEachDataPoint(function(p) {
        var provider = p.getData().provider;
        if (!providers[provider]) {
            providers[provider] = 1;
        } else {
            providers[provider] += 1;
        }
    });
    return providers;
}

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
legendHolder.className = 'legend';
legendHolder.innerHTML = [
    '<div class="dropdown">' +
        '<div class="dropdown__title">Select a technology</div>' +
        '<div class="dropdown__content">' +
            '<div class="dropdown__option">2G</div>' +
            '<div class="dropdown__option">3G</div>' +
            '<div class="dropdown__option">4G</div>' +
        '</div>' +
    '</div>' + '<div class="categories">'
].concat(
    Object.keys(PROVIDER_COLORS).map(function(provider) {
        return (
            '<div class="categories__item">' +
            '<span class="categories__bullet" style="background-color:' +
                PROVIDER_COLORS[provider] +
            '">' +
            '</span>' + 'Provider ' + provider +
            '</div>');
    }).join('')
).join('');
map.getElement().appendChild(legendHolder);
var dropdownTitle =  document.querySelector('.dropdown__title');
legendHolder.addEventListener('click', function(e) {
    if (e.target.className === 'dropdown__option') {
        dropdownTitle.innerText = e.target.innerText;
    }
});


$('head').append('<link rel="stylesheet" href="https://js.api.here.com/v3/3.0/mapsjs-ui.css" type="text/css" />');
