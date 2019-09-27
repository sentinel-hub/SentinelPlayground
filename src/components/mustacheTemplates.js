export const htmlTemplate = (template, params) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge, chrome=1" />
    <title>${template.title}</title>
    <style>
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
        }
        
        #devTestingDemo {
            height: 100%;
            width: 100%;
        }
    </style>
    ${template.scripts}
</head>

<body>
<div id="devTestingDemo"></div>
<script>
${template.content(params)}
        </script>
</body>
</html>
`;

const leafletScripts = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/leaflet.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/leaflet.js"></script>
`;
const gmapsScripts = `
<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=true"></script>

`;
const OLscripts = `
<link rel="stylesheet" href="https://openlayers.org/en/v4.6.2/css/ol.css" type="text/css">
<!-- The line below is only needed for old environments like Internet Explorer and Android 4.x -->
<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=requestAnimationFrame,Element.prototype.classList,URL"></script>
<script src="https://openlayers.org/en/v4.6.2/build/ol.js"></script>
`;

function OLContent(params) {
  const { url, lat, lng, zoom, ...rest } = params;
  return `
    var layers = [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        }),
        new ol.layer.Tile({
          source: new ol.source.TileWMS({
            url: "${url}",
            params: ${JSON.stringify(rest)},
            serverType: 'geoserver',
            transition: 0
          })
        })
      ];
      var map = new ol.Map({
        layers: layers,
        projection: 'EPSG:4326',
        target: 'devTestingDemo',
        view: new ol.View({
          center: ol.proj.transform([${lng}, ${lat}], 'EPSG:4326', 'EPSG:3857'),
          zoom: ${zoom}
        })
      });
 `;
}
function leafletContent(params) {
  const { url, lat, lng, zoom, ...rest } = params;
  return `
// OpenStreetMap
let osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});

// Sentinel Hub WMS service
// tiles generated using EPSG:3857 projection - Leaflet takes care of that
let baseUrl = "${url}";
let sentinelHub = L.tileLayer.wms(baseUrl, {
    tileSize: 512,
    attribution: '&copy; <a href="http://www.sentinel-hub.com/" target="_blank">Sentinel Hub</a>',
    ${Object.keys(rest)
      .map(key => {
        const value = rest[key];
        const isNumber = Number.isInteger(value);
        return '\t \t \t \t' + key + ':' + (isNumber ? value : '"' + value + '"') + ', \n';
      })
      .join(' ')}
});

let baseMaps = {
    'OpenStreetMap': osm
};
let overlayMaps = {
    'Sentinel Hub WMS': sentinelHub
}

let map = L.map('devTestingDemo', {
    center: [${lat}, ${lng}], // lat/lng in EPSG:4326
    zoom: ${zoom},
    layers: [osm, sentinelHub]
});

L.control.layers(baseMaps, overlayMaps).addTo(map);
`;
}
function gmContent(params) {
  const {
    lat,
    lng,
    zoom,
    url,
    layers,
    evalscript,
    evalscripturl,
    atmFilter,
    showDates,
    preview
  } = params;
  return `

  var map;
  
  var josefov = new google.maps.LatLng(49.3119, 16.67029);
  //Define OSM as base layer in addition to the default Google layers
  var osmMapType = new google.maps.ImageMapType({
                  getTileUrl: function (coord, zoom) {
                      return "http://tile.openstreetmap.org/" +
                  zoom + "/" + coord.x + "/" + coord.y + ".png";
                  },
                  tileSize: new google.maps.Size(256, 256),
                  isPng: true,
                  alt: "OpenStreetMap",
                  name: "OSM",
                  maxZoom: 19
              });

 //Define custom WMS tiled layer
 var SHLayer = new google.maps.ImageMapType({
                  getTileUrl: function (coord, zoom) {
                      var proj = map.getProjection();
                      var zfactor = Math.pow(2, zoom);
                      // get Long Lat coordinates
                      var top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 512 / zfactor, coord.y * 512 / zfactor));
                      var bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 512 / zfactor, (coord.y + 1) * 512 / zfactor));

                      //create the Bounding box string
                      var bbox =     (top.lng()) + "," +
                                     (bot.lat()) + "," +
                                     (bot.lng()) + "," +
                                     (top.lat());

                      //base WMS URL
                      var url = "${url}";
                      url += "?REQUEST=GetMap"; //WMS operation
                      url += "&SERVICE=WMS";    //WMS service
                      url += "&VERSION=1.1.1";  //WMS version  
                      url += "&LAYERS=${showDates ? layers + ',DATES' : layers}"; //WMS layers
                      url += "&FORMAT=image/jpg" ; //WMS format
                      url += "&SRS=EPSG:4326";     //set WGS84 
                      url += "&BBOX=" + bbox;      // set bounding box
                      url += "&WIDTH=512";         //tile size in google
                      url += "&HEIGHT=512";
                      ${evalscript ? 'url += "&EVALSCRIPT=' + evalscript + '"' : ''}
                      ${evalscripturl ? 'url += "&EVALSCRIPTURL=' + evalscripturl + '"' : ''}
                      ${atmFilter ? 'url += "&ATMFILTER=' + atmFilter + '"' : ''}
                      ${preview ? 'url += "&PREVIEW=3' : ''}
                      return url;                 // return URL for the tile

                  },
                  tileSize: new google.maps.Size(512, 512)
              });

                                                

              initialize();
  function initialize() {
      var mapOptions = {
          zoom: ${zoom},
          center: new google.maps.LatLng(${lat}, ${lng}),
          mapTypeId: 'OSM',
          mapTypeControlOptions: {
              mapTypeIds: ['OSM', google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN],
              style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          }
      };
      map = new google.maps.Map(document.getElementById("devTestingDemo"), mapOptions);
      map.mapTypes.set('OSM', osmMapType);
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      //add WMS layer
      map.overlayMapTypes.push(SHLayer);
     
  }
`;
}

export const mapTemplates = {
  LEAFLET: {
    label: 'Leaflet v1.2.0',
    id: 'Leaflet',
    title: 'Sentinel Hub WMS services with Leaflet',
    scripts: leafletScripts,
    content: leafletContent
  },
  OL: {
    label: 'Open Layers v3',
    id: 'OpenLayers',
    title: 'Sentinel Hub WMS services with Open Layers',
    scripts: OLscripts,
    content: OLContent
  },
  GMAPS: {
    label: 'Google Maps API v3',
    id: 'GoogleMaps',
    title: 'Sentinel Hub WMS services with Google Maps',
    scripts: gmapsScripts,
    content: gmContent
  }
};
