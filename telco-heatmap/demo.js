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

var mapHolder = document.getElementById('map');

var defaultLayers = platform.createDefaultLayers({tileSize: 512});
var baseLayer = defaultLayers.normal.basenight;

// instantiate (and display) a map
var map = new H.Map(
    mapHolder,
    baseLayer,
    {
        center: new H.geo.Point(40.760526, -73.985706),
        zoom: 12,
        style: 'default',
        pixelRatio: window.devicePixelRatio
    }
);

// set min zoom level
var minZoomLevel = 10;
map.getBaseLayer().setMin(minZoomLevel);

// enable map events
var mapEvents = new H.mapevents.MapEvents(map);
new H.mapevents.Behavior(mapEvents);

// load the signal strength heat map
var TILED_QUERY = 'fb5680c9e24b46909fb6662e71584435';

var dBColors = [
    'rgb(158, 1, 66)',
    'rgb(238, 100, 69)',
    'rgb(250, 177, 88)',
    'rgb(243, 250, 173)',
    'rgb(199, 250, 173)',
    'rgb(152, 213, 163)',
    'rgb(92, 183, 169)'
];

service.fetchQueryStats(TILED_QUERY, {
    // stats are used later to define the count range
    stats: (function() {
        var stats = [];
        for (var z = minZoomLevel; z <= 20; z++) {
            stats.push({
                column_stats: {
                    count: ['$average']
                },
                dynamic: {
                    x: '$drop',
                    y: '$drop',
                    z: z
                }
            });
        }
        return stats;
    })()
}).then(function(response) {
    var stats = response.stats;

    // create provider
    var provider = new H.datalens.QueryTileProvider(
        service,
        {
            queryId: TILED_QUERY,
            tileParamNames: {x: 'x', y: 'y', z: 'z'}
        }
    );

    // Define the bandwidth used in Kernel Density Estimation (KDE).
    // The bandwidth is set to increase with the zoom level so that it's geographically consistent.
    // The bandwidth is then clamped into the range [1, 42] to ensure that the spread of the Gaussian
    // kernel (3 * bandwidth) is less than half of the tile size.
    function bandwidth(z) {
        var b = Math.pow(2, z) / Math.pow(2, 18) * 100;
        b = b > 42 ? 42 : b;
        b = b < 1 ? 1 : b;
        return b;
    }

    // create heat map layer
    var layer = new H.datalens.HeatmapLayer(
        provider,
        {
            bandwidth: bandwidth,
            alphaScale: d3.scalePow().exponent(0.75),
            valueRange: [-95, -25],
            countRange: function(z) {
                var s = bandwidth(z);
                var columnStats = stats[z - minZoomLevel].column_stats;
                // Note that the "count" is normalized by the count range AFTER
                // the Gaussian kernel is applied, thus the count range should be
                // scaled by a factor of 1 / (2 * PI * sigma^2).
                return [
                    0,
                    columnStats.count.$average / s / s
                ];
            },
            colorScale: d3.scaleQuantize().domain([0, 1]).range(dBColors),
            aggregation: H.datalens.HeatmapLayer.Aggregation.AVERAGE,
            inputScale: H.datalens.HeatmapLayer.InputScale.DB,
            rowToTilePoint: function(row) {
                return {
                    x: row.tx,
                    y: row.ty,
                    count: row.count,
                    value: row.signal
                };
            }
        }
    );

    map.addLayer(layer);
}).done();

/**
 * This software contains open source components pursuant to the following licenses:
 * https://d3js.org Version 4.0.0-alpha.50.
 * Copyright 2016 Mike Bostock. License BSD-3-Clause
 */

/**
 * Boilerplate
 */

// legend
var legendHolder = document.createElement('div');
legendHolder.className = 'heatmap-legend';
legendHolder.innerHTML = [
    '<div class="heatmap-legend-heading">Heat map</div>',
    '<div class="heatmap-legend-paragraph">Signal strength (dB)</div>'
].join('');
map.getElement().appendChild(legendHolder);

var colorLegend = document.createElement('div');
colorLegend.className = 'heatmap-legend-discret-color-scale';

var s = '';
var ticks = [-90, -80, -70, -60, -50, -40, -30];
for (var i = 0; i < ticks.length; i++) {
    s += '<div class="heatmap-legend-break" style="background-color:' +
         dBColors[i] + '"><span class="heatmap-legend-v">' +
         ticks[i] + '</span></div>';
}
colorLegend.innerHTML = s;
legendHolder.appendChild(colorLegend);


$('head').append('<link rel="stylesheet" href="https://js.api.here.com/v3/3.0/mapsjs-ui.css" type="text/css" />');
