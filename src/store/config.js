import moment from 'moment';

const DATASOURCES = [
  {
    url: `https://services.sentinel-hub.com/ogc/wms/${process.env.REACT_APP_S2L1C_INSTANCE_ID}`,
    urlProcessingApi: `https://services.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_EVAL3_S2L1C_INSTANCE_ID
    }`,
    minDate: '2015-01-01',
    id: 'S2',
    datasourceID: 'S2L1C',
    name: 'Sentinel-2 L1C',
    typeNames: 'S2.TILE',
    cloudCoverageSupported: true,
    datesSupported: true
  },
  {
    url: `https://services.sentinel-hub.com/ogc/wms/${process.env.REACT_APP_S2L2A_INSTANCE_ID}`,
    urlProcessingApi: `https://services.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_EVAL3_S2L2A_INSTANCE_ID
    }`,
    minDate: '2017-03-28',
    id: 'S2L2A',
    datasourceID: 'S2L2A',
    name: 'Sentinel-2 L2A',
    typeNames: 'DSS2',
    min: 9,
    cloudCoverageSupported: true,
    datesSupported: true
  },
  {
    url: `https://services-uswest2.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_LOTL1_INSTANCE_ID
    }`,
    urlProcessingApi: `https://services-uswest2.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_EVAL3_LOTL1_INSTANCE_ID
    }`,
    minDate: '2013-01-01',
    id: 'L8',
    datasourceID: 'LOTL1',
    name: 'Landsat 8',
    min: 10,
    typeNames: 'DSS12',
    cloudCoverageSupported: true,
    datesSupported: true
  },
  {
    url: `https://services.sentinel-hub.com/ogc/wms/${process.env.REACT_APP_DEM_INSTANCE_ID}`,
    urlProcessingApi: `https://services.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_EVAL3_DEM_INSTANCE_ID
    }`,
    minDate: '2013-01-01',
    id: 'DEM',
    name: 'DEM',
    datasourceID: 'DEM',
    min: 2,
    typeNames: 'DSS4',
    cloudCoverageSupported: false,
    datesSupported: false
  },
  {
    url: `https://services-uswest2.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_MODIS_INSTANCE_ID
    }`,
    urlProcessingApi: `https://services-uswest2.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_EVAL3_MODIS_INSTANCE_ID
    }`,
    minDate: '2013-01-01',
    id: 'Modis',
    noEffects: true,
    name: 'MODIS',
    datasourceID: 'MODIS',
    min: 7,
    typeNames: 'DSS5',
    cloudCoverageSupported: false,
    datesSupported: true
  },
  {
    url: `https://services.sentinel-hub.com/ogc/wms/${process.env.REACT_APP_S1_AWS_IW_VVHV}`,
    urlProcessingApi: `https://services.sentinel-hub.com/ogc/wms/${
      process.env.REACT_APP_EVAL3_S1_AWS_IW_VVHV
    }`,
    minDate: '2017-01-01',
    id: 'S1-AWS-IW-VVVH',
    datasourceID: 'S1GRD',
    name: 'Sentinel-1 (IW-VVVH)',
    typeNames: 'DSS3',
    min: 1,
    cloudCoverageSupported: false,
    bandsRegex: /^(VV|VH)$/i,
    datesSupported: true
  }
  // {
  //   minDate: '2014-04-03',
  //   index: 'http://services.eocloud.sentinel-hub.com/index/s2/v1/finddates',
  //   id: 'S1_EW',
  //   datasourceID:'S1GRD',
  //   name: 'Sentinel-1'
  // },
  // {
  //   minDate: '2014-04-03',
  //   index: 'http://services.eocloud.sentinel-hub.com/index/s2/v1/finddates',
  //   id: 'S1_EW_SH',
  //   datasourceID:'S1GRD',
  //   name: 'Sentinel-1'
  // },
  // {
  //   minDate: '2014-04-03',
  //   index: 'http://services.eocloud.sentinel-hub.com/index/s2/v1/finddates',
  //   id: 'S1',
  //   datasourceID:'S1GRD',
  //   name: 'Sentinel-1'
  // },
  // {
  //   minDate: '2014-04-03',
  //   index: 'http://services.sentinel-hub.com/index/v3/collections/S1GRD/searchIndex',
  //   id: 'S1GRD',
  //   datasourceID:'S1GRD',
  //   name: 'Sentinel-1'
  // },
  // {
  //   minDate: '2017-03-28',
  //   index: 'http://services.eocloud.sentinel-hub.com/index/s2/v2/finddates/?processingType=1',
  //   id: 'S2L2A',
  //   datasourceID:'S2L2A',
  //   name: 'Sentinel-2 L2A'
  // },
  // {
  //   minDate: '2016-02-01',
  //   id: 'S3',
  //   datasourceID:'S3', // double check ifd correct
  //   index: 'http://services.eocloud.sentinel-hub.com/index/s3/v1/finddates',
  //   name: 'Sentinel-3'
  // },
  // {
  //   minDate: '2002-01-01',
  //   maxDate: '2012-05-01',
  //   index: 'http://services.eocloud.sentinel-hub.com/index/envisat/v1/finddates',
  //   id: 'ENV',
  //   datasourceID:'ENV',
  //   name: 'ENVISAT'
  // },
  // {
  //   minDate: '1984-01-01',
  //   maxDate: '2013-05-01',
  //   index: 'https://services.sentinel-hub.com/index/landsa5/v2/dates',
  //   id: 'L5',
  //   datasourceID:'L5',
  //   name: 'Landsat 5'
  // },
  // {
  //   minDate: '1999-01-01',
  //   maxDate: '2003-12-01',
  //   index: 'https://services.sentinel-hub.com/index/landsa7/v2/dates',
  //   id: 'L7',
  //   datasourceID:'L5',
  //   name: 'Landsat 7'
  // },
];

// export const datasourceInstances = DATASOURCES.map(source => {
//   return new SentinelHubWms(source.url, source.datasourceID, { name: source.name });
// });

const VIEWS = {
  PRESETS: '1',
  BANDS: '2',
  SCRIPT: '3'
};
export default {
  layers: {
    r: 'B04',
    g: 'B03',
    b: 'B02'
  },
  activeDatasource: { ...DATASOURCES[0] },
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
  imgDownloadBaseUrl: null,
  imgDownloadWmsParams: null,
  mapBounds: {},
  minDate: '2015-01-01', // deprecated
  maxDate: moment(),
  selectedDate: '',
  dateFormat: 'YYYY-MM-DD',
  availableDates: [],
  datesCcMap: {},
  onDayPicked: false,
  prevDate: null,
  nextDate: null,
  showDates: false,
  preset: null,
  currView: VIEWS.PRESETS,
  channels: [],
  path: '',
  presets: {},
  presetsLegend: [],
  atmFilter: '',
  gain: new Number(1).toFixed(1),
  gamma: new Number(1).toFixed(1),
  legendVisible: false,
  devMode: false,
  devModalVisible: false,
  legendX: 0,
  legendY: 0,
  legendHeight: 0,
  legendWidth: 0,
  legendUrl: null,
  views: VIEWS,
  datasources: DATASOURCES
};
