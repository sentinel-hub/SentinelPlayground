import moment from 'moment'

// fill this api keys for Playground display WMS requests
const SENTINEL_2_API_KEY = ''
const LANDSAT_8_API_KEY = ''
const MODIS_API_KEY = ''

const DATASOURCES = [
  {
    url: `https://services.sentinel-hub.com/ogc/wms/${SENTINEL_2_API_KEY}`,
    index: 'http://services.sentinel-hub.com/index/v3/collections/S2L1C/searchIndex',
    minDate: '2015-01-01',
    id: 'S2',
    name: 'Sentinel-2'
  },
  {
    minDate: '2014-04-03',
    index: 'http://services.eocloud.sentinel-hub.com/index/s2/v1/finddates',
    id: 'S1_EW',
    name: 'Sentinel-1'
  },
  {
    minDate: '2014-04-03',
    index: 'http://services.eocloud.sentinel-hub.com/index/s2/v1/finddates',
    id: 'S1_EW_SH',
    name: 'Sentinel-1'
  },
  {
    minDate: '2014-04-03',
    index: 'http://services.eocloud.sentinel-hub.com/index/s2/v1/finddates',
    id: 'S1',
    name: 'Sentinel-1'
  },
  {
    minDate: '2017-03-28',
    index: 'http://services.eocloud.sentinel-hub.com/index/s2/v2/finddates/?processingType=1',
    id: 'S2L2A',
    name: 'Sentinel-2 L2A'
  },
  {
    minDate: '2016-02-01',
    id: 'S3',
    index: 'http://services.eocloud.sentinel-hub.com/index/s3/v1/finddates',
    name: 'Sentinel-3'
  },
  {
    minDate: '2002-01-01',
    maxDate: '2012-05-01',
    index: 'http://services.eocloud.sentinel-hub.com/index/envisat/v1/finddates',
    id: 'ENV',
    name: 'ENVISAT'
  },
  {
    minDate: '1984-01-01',
    maxDate: '2013-05-01',
    index: 'https://services.sentinel-hub.com/index/landsa5/v2/dates',
    id: 'L5',
    name: 'Landsat 5'
  },
  {
    minDate: '1999-01-01',
    maxDate: '2003-12-01',
    index: 'https://services.sentinel-hub.com/index/landsa7/v2/dates',
    id: 'L7',
    name: 'Landsat 7'
  },
  {
    min: 10,
    minDate: '2013-01-01',
    index: 'https://services.sentinel-hub.com/index/landsa8/v2/dates',
    url: `https://services-uswest2.sentinel-hub.com/v1/wms/${LANDSAT_8_API_KEY}`,
    id: 'L8',
    name: 'Landsat 8'
  },
  {
    min: 5,
    minDate: '2013-01-01',
    index: 'https://services-uswest2.sentinel-hub.com/index/modis/v2/',
    url: `https://services-uswest2.sentinel-hub.com/v1/wms/${MODIS_API_KEY}`,
    id: 'Modis',
    noEffects: true,
    name: 'MODIS'
  }
]
const datasources = DATASOURCES,
  customPreset = {
    CUSTOM: {
      name: 'Custom',
      desc: 'Create custom rendering',
      image: 'image.jpg'
    }
  },
  VIEWS = {
    PRESETS: '1',
    BANDS: '2',
    SCRIPT: '3'
  }

export default {
  noCredentials: SENTINEL_2_API_KEY === '' && LANDSAT_8_API_KEY === '' && MODIS_API_KEY === '',
  customPreset,
  layers: {
    r: 'B04',
    g: 'B03',
    b: 'B02'
  },
  activeDatasource: {...DATASOURCES[0]},
  startLocation: '',
  doRefresh: true,
  activeBaseLayer: {
    name: '',
    minmax: { min: 0, max: 16 }
  },
  evalscripturl: '',
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
  imgWmsUrl: '',
  mapBounds: {},
  minDate: '2015-01-01',
  maxDate: moment(),
  selectedDate: moment(),
  dateFormat: 'YYYY-MM-DD',
  availableDays: [],
  datesCcMap: {},
  onDayPicked: false,
  prevDate: null,
  nextDate: null,
  showDates: false,
  preset: null,
  currView: VIEWS.PRESETS,
  channels: [],
  path: '',
  presets: {
    customPreset
  },
  presetsLegend: [],
  atmFilter: '',
  cloudCorrection: 'none',
  gain: new Number(1).toFixed(1),
  gamma: new Number(1).toFixed(1),
  legendVisible: false,
  devMode: false,
  selectedDevToolsTab: 1,
  devModalVisible: false,
  legendX: 0,
  legendY: 0,
  legendHeight: 0,
  legendWidth: 0,
  legendUrl: null,
  views: VIEWS,
  datasources
}