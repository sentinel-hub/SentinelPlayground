import config from './config';
import _ from 'lodash';

import { SentinelHubWms } from 'sentinelhub-js';

import URI from 'urijs';
import { calcBboxFromXY } from '../utils/coords';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { createStore, applyMiddleware, compose } from 'redux';
import { getMultipliedLayers } from '../utils/utils';
import moment from 'moment';

// eslint-disable-next-line
import rxjs from 'rxjs';

const SET_MAXCC = 'SET_MAXCC',
  SET_DATE = 'SET_DATE',
  SET_PRESET = 'SET_PRESET',
  SET_EVAL_MODE = 'SET_EVAL_MODE',
  SET_DATASOURCE = 'SET_DATASOURCE',
  SET_CURR_VIEW = 'SET_CURR_VIEW',
  SET_CHANNELS = 'SET_CHANNELS',
  SET_LAYERS = 'SET_LAYERS',
  SET_PRESETS = 'SET_PRESETS',
  SET_PRESETS_LEGEND = 'SET_PRESETS_LEGEND',
  SET_MAP_BOUNDS = 'SET_MAP_BOUNDS',
  SET_EVAL_URL = 'SET_EVAL_URL',
  SET_EVAL_SCRIPT = 'SET_EVAL_SCRIPT',
  SET_RENDERED_EVALSCRIPT = 'SET_RENDERED_EVALSCRIPT',
  SET_AVAILABLE_DAYS = 'SET_AVAILABLE_DAYS',
  SET_DATES_CC_MAP = 'SET_DATES_CC_MAP',
  SET_ON_DAY_PICKED = 'SET_ON_DAY_PICKED',
  SET_PREV_DATE = 'SET_PREV_DATE',
  SET_NEXT_DATE = 'SET_NEXT_DATE',
  SET_START_LOC = 'SET_START_LOC',
  SET_ATMFILTER = 'SET_ATMFILTER',
  SET_SHOW_DATES = 'SET_SHOW_DATES',
  SET_CLOCOR = 'SET_CLOCOR',
  SET_GAIN = 'SET_GAIN',
  SET_GAMMA = 'SET_GAMMA',
  SET_LAT = 'SET_LAT',
  SET_LNG = 'SET_LNG',
  SET_ZOOM = 'SET_ZOOM',
  SET_SIZE = 'SET_SIZE',
  GENERATE_WMS_URL = 'GENERATE_WMS_URL',
  REFRESH = 'REFRESH',
  SET_PATH = 'SET_PATH',
  SET_ACTIVE_BASE_LAYER = 'SET_ACTIVE_BASE_LAYER',
  SET_LEGEND_VISIBILITY = 'SET_LEGEND_VISIBILITY',
  SET_DEV_MODE = 'SET_DEV_MODE',
  SET_SELECTED_MAP_LIBRARY = 'SET_SELECTED_MAP_LIBRARY',
  SET_DEV_MODAL_VISIBILITY = 'SET_DEV_MODAL_VISIBILITY',
  SET_GOOGLE_MAPS_API_KEY = 'SET_GOOGLE_MAPS_API_KEY',
  SET_TEMP_GOOGLE_MAPS_API_KEY = 'SET_TEMP_GOOGLE_MAPS_API_KEY',
  SET_SELECTED_DEV_TOOLS_TAB = 'SET_SELECTED_DEV_TOOLS_TAB',
  SET_LEGEND_X = 'SET_LEGEND_X',
  SET_LEGEND_Y = 'SET_LEGEND_Y',
  SET_LEGEND_HEIGHT = 'SET_LEGEND_HEIGHT',
  SET_LEGEND_WIDTH = 'SET_LEGEND_WIDTH',
  SET_LEGEND_OBJ = 'SET_LEGEND_OBJ',
  SET_RECAPTCHA_AUTH_TOKEN = 'SET_RECAPTCHA_AUTH_TOKEN';

const Reducers = {
  SET_MAXCC: maxcc => ({ maxcc }),
  SET_DATE: selectedDate => {
    return { selectedDate };
  },
  SET_PRESET: preset => {
    const isCustom = preset === 'CUSTOM';
    return { preset, currView: isCustom ? '2' : '1' };
  }, //in config VIEWS for Bands
  SET_DATASOURCE: setDatasource,
  SET_PRESETS: presets => ({ presets }),
  SET_PRESETS_LEGEND: setPresetsLegend,
  SET_CURR_VIEW: currView => ({ currView }),
  SET_MAP_BOUNDS: mapBounds => ({ mapBounds }),
  SET_AVAILABLE_DAYS: availableDates => ({ availableDates }),
  SET_DATES_CC_MAP: datesCcMap => ({ datesCcMap }),
  SET_ON_DAY_PICKED: onDayPicked => ({ onDayPicked }),
  SET_PREV_DATE: prevDate => ({ prevDate }),
  SET_NEXT_DATE: nextDate => ({ nextDate }),
  SET_EVAL_SCRIPT: evalscript => ({ evalscript }),
  SET_RENDERED_EVALSCRIPT: renderedEvalscript => ({ renderedEvalscript }),
  SET_CHANNELS: function(channels, presets) {
    const [r, g, b] = channels;
    const defaultPreset = this.preset || presets[0].id;
    return {
      channels,
      presets,
      preset: defaultPreset,
      // if only one channel present, use that only for all 3 bands
      layers:
        b !== undefined ? { r: r.name, g: g.name, b: b.name } : { r: r.name, g: r.name, b: r.name }
    };
  },
  SET_START_LOC: startLocation => ({ startLocation }),
  SET_LAYERS: layers => ({ layers }),
  SET_ATMFILTER: atmFilter => ({ atmFilter }),
  SET_GAIN: gain => ({ gain }),
  SET_GAMMA: gamma => ({ gamma }),
  SET_SHOW_DATES: showDates => ({ showDates }),
  SET_LAT: lat => ({ lat }),
  SET_LNG: lng => ({ lng }),
  SET_ZOOM: zoom => ({ zoom }),
  SET_EVAL_MODE: isEvalUrl => ({ isEvalUrl }),
  SET_EVAL_URL: evalscripturl => ({ evalscripturl }),
  SET_SIZE: size => ({ size }),
  SET_CURRENT_DATE: currentDate => ({ currentDate }),
  GENERATE_WMS_URL: generateWmsUrl,
  SET_PATH: updatePath,
  REFRESH: () => ({}),
  SET_ACTIVE_BASE_LAYER: setActiveBaseLayer,
  SET_LEGEND_VISIBILITY: legendVisible => ({ legendVisible }),
  SET_DEV_MODE: devMode => ({ devMode }),
  SET_SELECTED_MAP_LIBRARY: selectedMapLibrary => ({ selectedMapLibrary }),
  SET_DEV_MODAL_VISIBILITY: devModalVisible => ({ devModalVisible }),
  SET_GOOGLE_MAPS_API_KEY: googleMapsApiKey => ({ googleMapsApiKey }),
  SET_TEMP_GOOGLE_MAPS_API_KEY: tempGoogleMapsApiKey => ({
    tempGoogleMapsApiKey
  }),
  SET_SELECTED_DEV_TOOLS_TAB: selectedDevToolsTab => ({ selectedDevToolsTab }),
  SET_LEGEND_X: legendX => ({ legendX }),
  SET_LEGEND_Y: legendY => ({ legendY }),
  SET_LEGEND_HEIGHT: legendHeight => ({ legendHeight }),
  SET_LEGEND_WIDTH: legendWidth => ({ legendWidth }),
  SET_LEGEND_OBJ: legendObj => ({ legendObj }),
  SET_RECAPTCHA_AUTH_TOKEN: recaptchaAuthToken => ({ recaptchaAuthToken }),
};

const DoesNeedRefresh = [
  SET_MAXCC,
  SET_DATE,
  SET_PRESET,
  SET_LAYERS,
  SET_ATMFILTER,
  SET_CLOCOR,
  SET_GAIN,
  SET_GAMMA,
  SET_DATASOURCE
];
const DoRefreshUrl = [
  SET_DATASOURCE,
  SET_LAT,
  SET_LNG,
  SET_ZOOM,
  SET_EVAL_SCRIPT,
  SET_MAXCC,
  SET_DATE,
  SET_PRESET,
  SET_LAYERS,
  SET_ATMFILTER,
  SET_SHOW_DATES,
  SET_CLOCOR,
  SET_GAIN,
  SET_GAMMA,
  SET_DEV_MODE,
  SET_EVAL_MODE
];

function updatePath() {
  const {
    layers,
    selectedDate,
    dateFormat,
    evalscript,
    baseWmsUrl,
    instanceID,
    datasources,
    activeDatasource: { id, url },
    lat,
    lng,
    preset,
    maxcc,
    gain,
    gamma,
    zoom,
    evalscripturl,
    atmFilter,
    showDates
  } = this;
  const pLayers = Object.keys(layers)
    .map(k => layers[k])
    .join(',');
  const fromDate = moment(this.selectedDate)
    .subtract('months', 6)
    .startOf('month');
  const pTime = `${fromDate.format(dateFormat)}%7C${moment(selectedDate).format(dateFormat)}`;
  const es = encodeURIComponent(evalscript);
  const evalScriptParam =
    evalscript !== btoa('return [' + getMultipliedLayers(pLayers) + ']') ? `evalscript=${es}` : '';
  const params = [];
  const currentDS = datasources.find(ds => ds.url && ds.url === url);
  if (instanceID && currentDS.private) {
    params.push(`baseWmsUrl=${baseWmsUrl}`);
    params.push(`instanceID=${instanceID}`);
  }
  params.push(`source=${id}`);
  params.push(`lat=${lat}`);
  params.push(`lng=${lng}`);
  params.push(`zoom=${zoom}`);
  params.push(`preset=${preset}`);
  params.push(`layers=${pLayers}`);
  params.push(`maxcc=${maxcc}`);
  params.push(`gain=${gain}`);
  params.push(`gamma=${gamma}`);
  params.push(`time=${pTime}`);
  params.push(`atmFilter=${atmFilter}`);
  params.push(`showDates=${showDates}`);
  if (preset === 'CUSTOM') {
    evalScriptParam.length !== '' && params.push(`${evalScriptParam}`);
    evalscripturl !== '' && params.push(`evalscripturl=${evalscripturl}`);
  }

  const path = params.join('&');
  if (window.history.pushState) {
    var newurl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?' +
      path;
    window.history.pushState({ path: newurl }, '', newurl);
  } else {
    window.location.hash = path;
  }

  return { path };
}

function setDatasource(ds) {
  const { selectedDate: currDate } = this;
  const { minDate, maxDate = moment() } = ds;
  const selectedDate =
    moment(currDate).isBefore(minDate) || moment(currDate).isAfter(maxDate)
      ? moment(maxDate)
      : currDate;
  return {
    activeDatasource: ds,
    selectedDate,
    minDate,
    maxDate: moment(maxDate)
  };
}

function setActiveBaseLayer(name, minmax) {
  return {
    activeBaseLayer: {
      name: name,
      minmax: { min: minmax.min, max: minmax.max }
    }
  };
}

function generateWmsUrl() {
  const { isEvalUrl, evalscripturl } = this;
  const { url: dsUrl, name, id, datasourceID } = this.activeDatasource;
  const fromDate = moment(this.selectedDate)
    .subtract('month', 6)
    .startOf('month');
  const dateLayer = this.showDates ? ',DATE' : '';

  let params = {
    maxcc: this.maxcc,
    layers: (this.preset === 'CUSTOM' ? this.presets[1].id : this.preset) + dateLayer,
    evalsource: id || 'S2',
    width: this.size[0] - 80,
    height: this.size[1] - 100,
    format: 'image/jpeg',
    nicename: `${name} image on ${this.selectedDate.format(this.dateFormat)}.jpg`,
    bbox: calcBboxFromXY([this.lat, this.lng], this.zoom).join(','),
    time: `${fromDate.format(this.dateFormat)}/${this.selectedDate.format(this.dateFormat)}`,
    showlogo: true,
    bgcolor: '000000'
  };

  if (Number(this.gain).toFixed(1) !== '1.0') {
    params.gain = this.gain;
  }
  if (Number(this.gamma).toFixed(1) !== '1.0') {
    params.gamma = this.gamma;
  }
  if (this.atmFilter) {
    params.atmfilter = this.atmFilter;
  }
  if (this.preset === 'CUSTOM') {
    params.preview = 3;
    params.evalscript = this.evalscript;
    if (isEvalUrl && evalscripturl !== '') {
      params.evalscripturl = evalscripturl;
      delete params.evalscript;
    }
  }

  const getMapUrl = new SentinelHubWms(dsUrl, datasourceID).getMapUrl(params);

  return { imgWmsUrl: getMapUrl };
}

function setPresetsLegend(value) {
  return { presetsLegend: value };
}

function mustRefresh(actions) {
  // NOTE: even though rxjs documentation says to use .debounce,
  // you are actually supposed to use debounceTime
  return actions
    .filter(action => DoesNeedRefresh.includes(action.type))
    .debounceTime(600)
    .mapTo({ type: REFRESH, args: [] });
}
function refreshPath(actions) {
  return actions
    .filter(action => DoRefreshUrl.includes(action.type))
    .debounceTime(1000)
    .mapTo({ type: SET_PATH, args: [] });
}

function reducer(currentState, action) {
  return action.args
    ? Object.assign({}, currentState, Reducers[action.type].call(currentState, ...action.args), {
        action
      })
    : currentState;
}

const store = createStore(
  reducer,
  config,
  compose(
    applyMiddleware(createEpicMiddleware(combineEpics(mustRefresh, refreshPath))),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )
);

if (window.devToolsExtension) {
  window.devToolsExtension.updateStore(store);
}

function action(x) {
  return (...args) => store.dispatch({ type: x, args });
}

export default {
  get current() {
    return store.getState();
  },
  get Store() {
    return store;
  },
  setMaxcc: action(SET_MAXCC),
  setDate: action(SET_DATE),
  setAvailableDates: action(SET_AVAILABLE_DAYS),
  setDatesCcMap: action(SET_DATES_CC_MAP),
  setOnDayPicked: action(SET_ON_DAY_PICKED),
  setPrevDate: action(SET_PREV_DATE),
  setNextDate: action(SET_NEXT_DATE),
  setPreset: action(SET_PRESET),
  setCurrentView: action(SET_CURR_VIEW),
  setPresets: action(SET_PRESETS),
  setPresetsLegend: action(SET_PRESETS_LEGEND),
  setEvalScript: action(SET_EVAL_SCRIPT),
  setRenderedEvalscript: action(SET_RENDERED_EVALSCRIPT),
  setChannels: action(SET_CHANNELS),
  setLayers: action(SET_LAYERS),
  setEvalUrl: action(SET_EVAL_URL),
  setShowDates: action(SET_SHOW_DATES),
  setStartLocation: action(SET_START_LOC),
  setMapBounds: action(SET_MAP_BOUNDS),
  setAtmFilter: action(SET_ATMFILTER),
  setDatasource: action(SET_DATASOURCE),
  setGain: action(SET_GAIN),
  setGamma: action(SET_GAMMA),
  setLat: action(SET_LAT),
  setLng: action(SET_LNG),
  setZoom: action(SET_ZOOM),
  setSize: action(SET_SIZE),
  refresh: action(REFRESH),
  generateWmsUrl: action(GENERATE_WMS_URL),
  updatePath: action(SET_PATH),
  setActiveBaseLayer: action(SET_ACTIVE_BASE_LAYER),
  setLegendVisiblity: action(SET_LEGEND_VISIBILITY),
  setDevMode: action(SET_DEV_MODE),
  setSelectedMapLibrary: action(SET_SELECTED_MAP_LIBRARY),
  setDevModalVisibility: action(SET_DEV_MODAL_VISIBILITY),
  setGoogleMapsApiKey: action(SET_GOOGLE_MAPS_API_KEY),
  setTempGoogleMapsApiKey: action(SET_TEMP_GOOGLE_MAPS_API_KEY),
  setSelectedDevToolsTab: action(SET_SELECTED_DEV_TOOLS_TAB),
  setLegendX: action(SET_LEGEND_X),
  setLegendY: action(SET_LEGEND_Y),
  setLEgendHeight: action(SET_LEGEND_HEIGHT),
  setLegendWidth: action(SET_LEGEND_WIDTH),
  setEvalMode: action(SET_EVAL_MODE),
  setLegendObj: action(SET_LEGEND_OBJ),
  setRecaptchaAuthToken: action(SET_RECAPTCHA_AUTH_TOKEN),
};
