/**
 * Display clustered markers on a map
 *
 * Note that the maps clustering module http://js.api.here.com/v3/3.0/mapsjs-clustering.js
 * must be loaded to use the Clustering

 * @param {H.Map} map A HERE Map instance within the application
 * @param {Array.<Object>} data Raw data that contains airports' coordinates
 */
function startClustering(map, data) {
  // First we need to create an array of DataPoint objects,
  // for the ClusterProvider
  var dataPoints = data.map(function (item) {
    return new H.clustering.DataPoint(item.latitude, item.longitude);
  });

  // Create a clustering provider with custom options for clusterizing the input
  var clusteredDataProvider = new H.clustering.Provider(dataPoints, {
    clusteringOptions: {
      // Maximum radius of the neighbourhood
      eps: 32,
      // minimum weight of points required to form a cluster
      minWeight: 2
    }
  });

  // Create a layer tha will consume objects from our clustering provider
  var clusteringLayer = new H.map.layer.ObjectLayer(clusteredDataProvider);

  // To make objects from clustering provder visible,
  // we need to add our layer to the map
  map.addLayer(clusteringLayer);
}


/**
 * Boilerplate map initialization code starts below:
 */

// Step 1: initialize communication with the platform
var platform = new H.service.Platform({
  app_id: 'DemoAppId01082013GAL',
  app_code: 'AJKnXv84fjrb0KIHawS0Tg',
  useHTTPS: true,
  useCIT: true
});
var defaultLayers = platform.createDefaultLayers();

// Step 2: initialize a map
var map = new H.Map(document.getElementById('map'), defaultLayers.normal.map, {
  center: new H.geo.Point(30.789, 33.790),
  zoom: 2
});

// Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));


// Step 4: create the default UI component, for displaying bubbles
var ui = H.ui.UI.createDefault(map, defaultLayers);

// Step 5: request data that will be visualized on a map
//
//  For convenience we use the jQuery library to make a dummy AJAX call to do this.
//  For more information see: http://api.jquery.com/jQuery.getJSON/
//
//  The jQuery library is available under an MIT license  https://jquery.org/license/
//
var url= '/gh/get/response.json/heremaps/jsfiddle-github/tree/master/marker-clustering/';
$.ajax({
    type: 'GET',
    dataType: 'json',
    url: url,
    success:  function (data) {
      startClustering(map, data);
    }
});


$('head').append('<link rel="stylesheet" href="https://js.api.here.com/v3/3.0/mapsjs-ui.css" type="text/css" />');
