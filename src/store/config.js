import moment from 'moment'

const common = {
    mapId: "mapId",
    baseWmsUrl: "services.sentinel-hub.com",
    indexBaseUrl: "services.sentinel-hub.com",
    instanceID: "YOUR_API_KEY"
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
  lat: 40.4,
  lng: -3.73,
  zoom: 12,
  size: [0, 0],
  priority: 'mostRecent',
  mosaic: 'mostRecent',
  evalscript: '',
  renderedEvalscript: '',
  opacity: 100,
  maxcc: 20,
  imgWmsUrl: "",
  mapBounds: {},
  minDate: "2015-01-01",
  maxDate: moment(),
  selectedDate: moment(),
  dateFormat: "YYYY-MM-DD",
  availableDays: [],
  availableDaysAllCc: [],
  prevDate: null,
  nextDate: null,
  showDates: false,
  preset: "",
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
  presetsLegend: [],
  "atmFilter": '',
  "cloudCorrection": 'none',
  "gain": 1,
  "gamma": 1,
  legendVisible: false,
  legendX: 0,
  legendY: 0,
  legendHeight: 0,
  legendWidth: 0,
  legendUrl: null,
  ...common,
  views
}
