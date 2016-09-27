import _                                        from 'lodash'
import URI                                      from 'urijs'
import {calcBboxFromXY}                         from '../utils/coords'
import { combineEpics }                         from 'redux-observable';
import {createEpicMiddleware}                   from 'redux-observable'
import {createStore, applyMiddleware, compose}  from 'redux'
import moment                                   from 'moment'

// eslint-disable-next-line
import rxjs from 'rxjs'

const
  SET_MAXCC =               'SET_MAXCC',
  SET_DATE =                'SET_DATE',
  SET_PRESET =              'SET_PRESET',
  SET_CURR_VIEW =           'SET_CURR_VIEW',
  SET_CHANNELS =            'SET_CHANNELS',
  SET_LAYERS =              'SET_LAYERS',
  SET_PRESETS =             'SET_PRESETS',
  SET_MAP_BOUNDS =          'SET_MAP_BOUNDS',
  SET_EVAL_SCRIPT =         'SET_EVAL_SCRIPT',
  SET_AVAILABLE_DAYS =      'SET_AVAILABLE_DAYS',
  SET_START_LOC =           'SET_START_LOC',
  SET_COLCOR =              'SET_COLCOR',
  SET_CLOCOR =              'SET_CLOCOR',
  SET_GAIN =                'SET_GAIN',
  SET_LAT=                  'SET_LAT',
  SET_LNG=                  'SET_LNG',
  SET_ZOOM =                'SET_ZOOM',
  SET_SIZE =                'SET_SIZE',
  GENERATE_WMS_URL =        'GENERATE_WMS_URL',
  REFRESH =                 'REFRESH',
  SET_PATH =                'SET_PATH',
  SET_ACTIVE_BASE_LAYER =   'SET_ACTIVE_BASE_LAYER'

const Reducers = {
  SET_MAXCC:          (maxcc) => ({ maxcc }),
  SET_DATE:           (selectedDate) => ({selectedDate}),
  SET_PRESET:         (preset) => ({preset}),
  SET_PRESETS:        (presets) => ({presets}),
  SET_CURR_VIEW:      (currView) => ({currView}),
  SET_MAP_BOUNDS:     (mapBounds) => ({mapBounds}),
  SET_AVAILABLE_DAYS: (availableDays) => ({availableDays}),
  SET_EVAL_SCRIPT:    (evalscript) => ({evalscript}),
  SET_CHANNELS:       (channels) => ({channels}),
  SET_START_LOC:      (startLocation) => ({startLocation}),
  SET_LAYERS:         (layers) => ({layers}),
  SET_COLCOR:         (colCor) => ({colCor}),
  SET_CLOCOR:         (cloudCorrection) => ({cloudCorrection}),
  SET_GAIN:           (gain) => ({gain}),
  SET_LAT:            (lat) => ({lat}),
  SET_LNG:            (lng) => ({lng}),
  SET_ZOOM:           (zoom) => ({zoom}),
  SET_SIZE:           (size) => ({size}),
  SET_CURRENT_DATE:   (currentDate) => ({currentDate}),
  GENERATE_WMS_URL:   generateWmsUrl,
  SET_PATH:           updatePath,
  REFRESH:            (doRefresh) => ({doRefresh}),
  SET_ACTIVE_BASE_LAYER:  setActiveBaseLayer
}


const DoesNeedRefresh = [
  SET_MAXCC, SET_DATE, SET_PRESET, SET_LAYERS, SET_COLCOR, SET_CLOCOR, SET_GAIN, SET_CURR_VIEW
]
const DoRefreshUrl = [
  SET_LAT, SET_LNG, SET_ZOOM, SET_EVAL_SCRIPT, SET_MAXCC, SET_DATE, SET_PRESET, SET_LAYERS, SET_COLCOR, SET_CLOCOR, SET_GAIN, SET_CURR_VIEW
]

function updatePath() {
  const store = this
  let layers = _.values(store.layers).join(",")
  let time = `2015-01-01|${moment(store.selectedDate).format(store.dateFormat)}`
  let evalScriptParam = (store.evalscript !== btoa("return [" + _.values(store.layers).join(",") + "]")) ? `evalscript=${store.evalscript}` : ""
  let params = []

  params.push(`lat=${ store.lat }`)
  params.push(`lng=${ store.lng }`)
  params.push(`zoom=${ store.zoom }`)
  params.push(`preset=${ store.preset }`)
  params.push(`layers=${ layers }`)
  params.push(`maxcc=${ store.maxcc }`)
  params.push(`gain=${ store.gain }`)
  params.push(`time=${ time }`)
  params.push(`cloudCorrection=${ store.cloudCorrection }`)
  params.push(`colCor=${ store.colCor }`)
  params.push(`${evalScriptParam}`)

  const path = params.join('/')
  window.location.hash = path
  return {path}
}

function setActiveBaseLayer(name, minmax) {
  return {activeBaseLayer: {
    name: name,
    minmax:{min: minmax.min, max: minmax.max}}
  }
}

function generateWmsUrl() {
  const url = new URI(this.baseImgWmsUrl)

  url.addQuery('MAXCC', this.maxcc)
  url.addQuery('LAYERS', this.preset === 'CUSTOM' ? _.values(this.layers).join(",") : this.preset)
  url.addQuery('GAIN', this.gain)
  url.addQuery('CLOUDCORRECTION', this.cloudCorrection)
  url.addQuery('WIDTH', this.size[0] - 50)
  url.addQuery('HEIGHT', this.size[1] - 100)
  url.addQuery('COLCOR', `${this.colCor},BOOST`)
  url.addQuery('FORMAT', 'image/jpeg')
  url.addQuery('BGCOLOR', '00000000')
  url.addQuery('TRANSPARENT', '1')
  url.addQuery('TIME', `2015-01-01/${this.selectedDate.format(this.dateFormat)}`)
  url.addQuery('BBOX', calcBboxFromXY([this.lat, this.lng], this.zoom).join(','))
  if (this.evalscript !== '')
    url.addQuery('EVALSCRIPT', this.evalscript)

  const browserUrl = url.toString().replace(/\%2f/gi, '/').replace(/\%2c/gi, ',')
  return {imgWmsUrl: browserUrl}
}

function mustRefresh(actions) {
  // NOTE: even though rxjs documentation says to use .debounce,
  // you are actually supposed to use debounceTime
  return actions.filter(action => DoesNeedRefresh.includes(action.type))
    .debounceTime(600)
    .mapTo({type: REFRESH, args: []})
}
function refreshPath(actions) {
  return actions.filter(action => DoRefreshUrl.includes(action.type))
    .debounceTime(1000)
    .mapTo({type: SET_PATH, args: []})
}

function reducer(currentState, action) {
  if (Reducers[action.type]) {
    return Object.assign({}, currentState,
      Reducers[action.type].call(currentState, ...(action.args)), {action})
  }
  return currentState // DO NOTHING IF NO MATCH
}

const store = createStore(reducer, require('./config'),
  compose(
    applyMiddleware(createEpicMiddleware(combineEpics(mustRefresh, refreshPath))),
    window.devToolsExtension ? window.devToolsExtension() : f => f))

if (window.devToolsExtension) {
  window.devToolsExtension.updateStore(store)
}

function action(x) {
  return (...args) => store.dispatch({type: x, args})
}

module.exports = {
  get current() {
    return store.getState()
  },
  get Store() {
    return store
  },

  setMaxcc:             action(SET_MAXCC),
  setDate:              action(SET_DATE),
  setAvailableDates:    action(SET_AVAILABLE_DAYS),
  setPreset:            action(SET_PRESET),
  setCurrentView:       action(SET_CURR_VIEW),
  setPresets:           action(SET_PRESETS),
  setEvalScript:        action(SET_EVAL_SCRIPT),
  setChannels:          action(SET_CHANNELS),
  setLayers:            action(SET_LAYERS),
  setStartLocation:     action(SET_START_LOC),
  setMapBounds:         action(SET_MAP_BOUNDS),
  setColorCorrection:   action(SET_COLCOR),
  setCloudCorrection:   action(SET_CLOCOR),
  setGain:              action(SET_GAIN),
  setLat:               action(SET_LAT),
  setLng:               action(SET_LNG),
  setZoom:              action(SET_ZOOM),
  setSize:              action(SET_SIZE),
  refresh:              action(REFRESH),
  generateWmsUrl:       action(GENERATE_WMS_URL),
  updatePath:           action(SET_PATH),
  setActiveBaseLayer:   action(SET_ACTIVE_BASE_LAYER)
}
