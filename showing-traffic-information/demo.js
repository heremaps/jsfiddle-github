function enableTrafficInfo (map) {
  // Center map on New York
  map.setCenter({lat: 40.74007175329128, lng: -73.8701876028157});
  map.setZoom(11);

  // Show traffic tiles
  map.setBaseLayer(defaultLayers.normal.traffic);

  // Enable traffic incidents layer
  map.addLayer(defaultLayers.incidents);
}

/**
 * Boilerplate map initialization code starts below:
 */
// Step 1: initialize communication with the platform
var platform = new H.service.Platform({
  app_id: 'DemoAppId01082013GAL',
  app_code: 'AJKnXv84fjrb0KIHawS0Tg',
  useCIT: true,
  useHTTPS: true
});
var defaultLayers = platform.createDefaultLayers();

// Step 2: initialize a map  - not specificing a location will give a whole world view.
var map = new H.Map(document.getElementById('map'), defaultLayers.normal.map);




// Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

// Now enable traffic tiles and traffic incidents
enableTrafficInfo(map);

$('head').append('<link rel="stylesheet" href="https://js.api.here.com/v3/3.0/mapsjs-ui.css" type="text/css" />');
