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

var COLORS = [
    'rgba(158, 1, 66, 0.85)',
    'rgba(238, 100, 69, 0.85)',
    'rgba(250, 177, 88, 0.85)',
    'rgba(243, 250, 173, 0.85)',
    'rgba(243, 250, 173, 0.85)',
    'rgba(199, 250, 173, 0.85)',
    'rgba(152, 213, 163, 0.85)',
    'rgba(92, 183, 169, 0.85)'
];

var pixelRatio = devicePixelRatio > 1 ? 2 : 1;

var mapHolder = document.getElementById('map');

// instantiate (and display) a map
var map = new H.Map(
    mapHolder,
    platform.getMapTileService({type: 'base'}).createTileLayer(
        'maptile',
        'reduced.night',
        256 * pixelRatio, // bigger tile size for retina
        'png'
    ),
    {
        center:  new H.geo.Point(40.75201, -73.85266),
        zoom: 11,
        style: 'default',
        pixelRatio: window.devicePixelRatio
    }
);

var mapEvents = new H.mapevents.MapEvents(map);
new H.mapevents.Behavior(mapEvents);

var QUERY = '569a2fbd6f1e4e1e9483c5ad5409e1d5';

var provider = new H.datalens.QueryProvider(
    service,
    {
        queryId: QUERY
    }
);

// Using quantile scales, since domain is not a linear scale,
// but still need to snap value within these domain ranges.
var valueScale = d3.scaleQuantile()
    .domain([-132, -121, -111, -99.9, -89.1, -78.4, -67.7, -57])
    .range(COLORS);

var layer = new H.datalens.ObjectLayer(
    provider,
    {
        pixelRatio: window.devicePixelRatio,

        dataToRows: function(data) {
            // Default data mapping it's not used, because
            // of duplicate column names within data.columns
            return data.rows;
        },

        // takes row and returns polygon
        rowToMapObject: function(row) {
            // Each rows corresponds to the columns:
            // top_x, bottom_y, top_x, top_y, bottom_x, top_y, bottom_x, bottom_y
            // where a square point is defined by a pair of points,
            // i.e. (top_x, bottom_y). That's why H.geo.Strip is initialised
            // with (row[2], row[1]) etc.
            var strip = new H.geo.Strip([
                row[2], row[1], 0,
                row[4], row[3], 0,
                row[6], row[5], 0,
                row[8], row[7], 0
            ]);
            return new H.map.Polygon(strip);
        },

        rowToStyle: function(row) {
            var val = row[0];
            return {
                style: {
                    fillColor: valueScale(val),
                    lineWidth: 0
                }
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

var PROVIDERS = {
    'Provider 1': '1',
    'Provider 2': '2',
    'Provider 3': '3',
    'Provider 4': '4',
    'Provider 5': '5'
};

var legendHolder = document.createElement('div');
legendHolder.className = 'rastermap-legend';
legendHolder.innerHTML = [
    '<div class="heading">Providers</div>' +
    '<div class="paragraph">' +
        'Shows raster cells 250x250 meters selected by provider.</div>' +
    '<div class="dropdown">' +
    '<button class="custom-dropdown">Select a provider</button>' +
    '<div class="dropdown-content">'
].concat(
    Object.keys(PROVIDERS).map(function(provider) {
        return '<div val="' + PROVIDERS[provider] + '">' +
                provider + '</div>';
    }).join('')
).concat([
    '</div></div></div>'
]).join('');

map.getElement().appendChild(legendHolder);

var btn = document.querySelector('.dropdown-content');
var cd = document.querySelector('.custom-dropdown');

cd.addEventListener('click', function() {
    if (btn.classList.contains('open')) {
        cd.classList.add('cd-open');
        btn.classList.remove('open');
    } else {
        cd.classList.remove('cd-open');
        btn.classList.add('open');
    }
});

var dropDown = document.querySelector('.dropdown-content');

dropDown.addEventListener('click', function(e) {
    var value = e.target.getAttribute('val');
    btn.classList.remove('open');
    cd.innerHTML = e.target.innerHTML;
    cd.classList.remove('cd-open');

    // invoke reload of provider
    provider.setQueryParams({provider_filter: value});
    provider.reload();
});


$('head').append('<link rel="stylesheet" href="https://js.api.here.com/v3/3.0/mapsjs-ui.css" type="text/css" />');
