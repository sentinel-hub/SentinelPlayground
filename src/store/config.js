import moment from 'moment'

const common = {
    mapId: "mapId",
    baseWmsUrl: "http://services.sentinel-hub.com",
    instanceID: "YOUR_SENTINEL_API"
  },
  urls = {
    baseIndexUrl: common.baseWmsUrl,
    serviceWmsUrl: `${common.baseWmsUrl}/v1/wms/${common.instanceID}`,
    capabilitiesUrl: `${common.baseWmsUrl}/v1/wms/${common.instanceID}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`,
    baseImgWmsUrl: `${common.baseWmsUrl}/v1/wms/${common.instanceID}?SERVICE=WMS&REQUEST=GetMap`
  },
  views = {
    PRESETS: "1",
    BANDS: "2",
    SCRIPT: "3"
  }

module.exports = {
  layers: {
    r: "B04",
    g: "B03",
    b: "B02"
  },
  startLocation: '',
  doRefresh: true,
  activeBaseLayer: {
    name: '',
    minmax: {min: 0, max: 16}
  },
  isLoaded: true,
  lat: 51.37,
  lng: -0.11,
  zoom: 13,
  size: [0, 0],
  priority: 'mostRecent',
  mosaic: 'mostRecent',
  evalscript: '',
  opacity: 100,
  maxcc: 20,
  imgWmsUrl: "",
  mapBounds: {},
  minDate: "2015-01-01",
  maxDate: moment(),
  selectedDate: moment(),
  dateFormat: "YYYY-MM-DD",
  availableDays: [],
  preset: "1_NATURAL_COLOR",
  currView: views.PRESETS,
  channels: [],
  path: '',
  presets: {
    "CUSTOM": {
      name: "Custom",
      desc: "Create custom rendering",
      image: "image.jpg"
    },
  },
  "colCor": '',
  "cloudCorrection": 'none',
  "gain": 1,
  ...common,
  ...urls,
  views
}
