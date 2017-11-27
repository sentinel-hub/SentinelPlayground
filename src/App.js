import React, { Component } from 'react'
import Map from './components/Map'
import Tools from './components/Tools'
import DatePicker from './components/DatePicker'
import CloudSlider from './components/CloudSlider'
import SearchBox from './components/SearchBox'
import DummyIcon from './components/DummyIcon'
import PlaygroundLegend from './components/PlaygroundLegend'
import GenerateImgPanel from './components/GenerateImgPanel'
import { loadGetCapabilities } from './utils/ajax'
import { queryDates2, manipulateFromTo } from './utils/datesHelper'
import { getPolyfill, getMultipliedLayers, b64EncodeUnicode } from './utils/utils'
import Rodal from 'rodal'
import 'rodal/lib/rodal.css'
import keydown from 'react-keydown'
import moment from 'moment'
import _ from 'lodash'
import { connect } from 'react-redux'
import Store from './store'
import Draggable from 'react-draggable'
import './App.scss'
import DatasourceSwitch from './components/DatasourceSwitch'
import axios from 'axios';

let urlChangeIntrevalId = null
let oldUrl = null
try {
  oldUrl = window.location.href
} catch (e) {}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoaded: false,
      showImage: false,
      isDateVisible: false,
      toolsVisible: true,
      isCopied: false,
      error: null,
      legendDataLoaded: false,
      legendDataError: false
    }
    getPolyfill()
  }

  render() {
    return <div>{this.getContent()}</div>
  }

  onResize = () => {
    Store.setSize([window.innerWidth, window.innerHeight])
  }

  componentDidMount() {
    const {noCredentials} = this.props
    if (noCredentials) {
      this.setState({loadError: true, loadMessage: 'No credentials. Open config.js file to fill in API keys.'})
      return
    }
    const ds = this.handleUrlAndCreateDS()
    loadGetCapabilities(ds, true)
      .then(() => {
        this.setState({ isLoaded: true, isModal: false, isLegendModal: false })
        // this.handleUrl()
        urlChangeIntrevalId = setInterval(() => {
          let currentUrl = undefined
          try {
            currentUrl = window.location.href
          } catch (e) {}

          if (oldUrl !== currentUrl) {
            oldUrl = currentUrl
            this.queryDates(undefined, false, false)

            return
          }
        }, 3000)
        if (this.state.showImage) {
          this.doGenerate()
        }
      })
      .catch(e => {
        console.error(e)
        this.setState({
          loadError: true,
          loadMessage: JSON.stringify(e)
        })
      })
  }

  componentWillReceiveProps({ keydown }) {
    if (keydown.event) {
      if (keydown.event.code === 'Escape') {
        this.setState({
          isDateVisible: false,
          isCloudVisible: false
        })
        this.hideModal()
        this.hideLegendModal()
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.preset !== Store.current.preset) {
      this.setState({ legendDataLoaded: false, legendDataError: false })
    }
  }

  hideModal = () => {
    this.setState({ isModal: false, error: null })
  }
  hideLegendModal = () => {
    this.setState({ isLegendModal: false })
  }
  toggleLegendModal = e => {
    this.setState({ isLegendModal: !this.state.isLegendModal })
  }

  setMapLocation = data => {
    const { lat, lng } = data.location
    Store.setLat(lat)
    Store.setLng(lng)
    this.map.wrappedInstance.mainMap.setView([lat, lng], Store.current.zoom)
  }

  doGenerate = () => {
    Store.generateWmsUrl()
    this.setState({ isModal: true, showImage: false })
  }

  parseEvalscript = ({ value, parsedObj }) => {
    const { layers } = parsedObj
    let evalScript = value
    let valid = true

    if (evalScript === '/showImage') {
      valid = false
    }

    try {
      evalScript = decodeURIComponent(value)
      atob(evalScript)
    } catch (e) {
      valid = false
    }

    if (valid) {
      parsedObj['evalscript'] = evalScript // + "==";
      evalScript !== btoa('return [' + getMultipliedLayers(layers) + ']') &&
        (parsedObj['currView'] = Store.current.views.SCRIPT)
      parsedObj['showDates'] = false
    }
  }

  createDatasource = params => {
    let paramsMap = {}
    params.forEach(p => {
      const [key, value] = p.split('=')
      paramsMap[key] = value
    })
    const { instanceID, baseWmsUrl, layermap, source, http } = paramsMap
    const { datasources, selectedDate } = Store.current
    let lmValue = ''
    if (layermap) {
      const [first] = layermap.split(';')
      const [name, dsValue] = first.split(',')
      lmValue = dsValue
    }
    const datasource = datasources.find(ds => ds.id === (source || lmValue)) || datasources[0] // fallback is S2
    const { minDate, maxDate = moment(), id } = datasource
    let obj = {}
    obj['minDate'] = minDate
    obj['maxDate'] = moment(maxDate)
    if (moment(maxDate).isBefore(moment(paramsMap.time && paramsMap.time.split('/')[1]))) {
      obj.selectedDate = moment(maxDate)
    }
    obj['evalsource'] = id
    obj['source'] = id
    obj['activeDatasource'] = { ...datasource }
    if (instanceID) {
      const noHttps = http === 'true' || baseWmsUrl.includes('eocloud')
      obj['devMode'] = true
      const isNew = baseWmsUrl === 'services.sentinel-hub.com'
      obj.activeDatasource.url = `${noHttps ? 'http' : 'https'}://${baseWmsUrl}/${isNew ? 'ogc' : 'v1'}/wms/${instanceID}`
      obj.activeDatasource.private = true
    }
    return obj
  }

  handleUrlAndCreateDS = () => {
    const hasSearch = window.location.href.includes('?')
    var path = hasSearch ? window.location.search : window.location.hash.replace(/^#\/?|\/$/g, '')
    if (hasSearch) {
      path = path.replace('?', '')
    }
    path = path.replace('%7C', '/')
    Store.current.path = path
    if (path.includes('showImage')) {
      this.setState({ showImage: true })
    }

    let parsedObj = {}
    const hasAndSeparator = path.includes('&')
    // falback for previous separations
    let params = path.split(hasAndSeparator ? '&' : '/')

    params.forEach((val) => {
      let [key, value] = val.split('=')
      switch (key) {
        case 'time':
          if (value.includes('/') || value.includes('|')) {
            let t = value.replace(/\|/g, '/')
            parsedObj[key] = t
            parsedObj['selectedDate'] = moment(t.split('/')[1])
          } else {
            parsedObj.selectedDate = moment(value)
          }
          break
        case 'x' || 'lat':
          parsedObj['lat'] = value
          break
        case 'lng' || 'y':
          parsedObj['lng'] = value
          break
        case 'showDates':
          parsedObj[key] = value === 'true'
          break
        case 'evalscript':
          value !== '' && this.parseEvalscript({ parsedObj, value })
          break
        case 'evalscripturl':
          this.loadEvalscript(value)
          parsedObj[key] = value
          break
        case 'layers':
          if (parsedObj['preset'] === 'CUSTOM') {
            const [r, g, b] = value.split(',')
            parsedObj[key] = { r, g, b }
            parsedObj['currView'] = Store.current.views.BANDS
          }
          break
        default:
          parsedObj[key] = value
          break
      }
    })

    if (
      (parsedObj['lat'] === '0' || parsedObj['lat'] === 0) &&
      (parsedObj['lng'] === '0' || parsedObj['lng'] === 0) &&
      (parsedObj['zoom'] === '1' || parsedObj['zoom'] === 1)
    ) {
      // Madrid - default of config.js
      parsedObj['lat'] = 40.4
      parsedObj['lng'] = -3.73
      parsedObj['zoom'] = 12
    }
    this.queryDates(undefined, false, false)
    const ds = this.createDatasource(params)
    _.merge(Store.current, parsedObj, ds)
    return ds.activeDatasource
  }

  loadEvalscript = (value) => {
    const url = window.decodeURIComponent(value)
    axios.get(url).then(res => {
      try {
        Store.setEvalScript(b64EncodeUnicode(res.data))
        Store.setEvalUrl(url)
        // Store.setEvalMode(true)
        Store.setPreset('CUSTOM')
        Store.setCurrentView('3')
      } catch(e) {
        Store.setEvalUrl(url)

      }
    }).catch(e => console.error(e))
  }

  onCopy = () => {
    this.setState({ isCopied: true })
    setTimeout(() => {
      this.setState({ isCopied: false })
    }, 3000)
  }

  queryDates(dateFrom, dateTo, justQuery = false) {
    let { _from, _to } = manipulateFromTo(dateFrom, dateTo)
    if (dateFrom === true && dateTo === undefined) {
      _from = window.lastValidFrom
      _to = window.lastValidTo
    }

    queryDates2(_from, _to, false)
  }

  handleModalSuccess = () => {
    this.setState({ legendDataLoaded: true, legendDataError: false })
  }

  handleModalError = () => {
    this.setState({ legendDataLoaded: true, legendDataError: true })
  }

  handleDatePickerOnSelect = e => {
    const { selectedDate, dateFormat, datesCcMap, availableDays } = Store.current

    if (!window.avaDay) {
      window.avaDay = {}
    }
    if (availableDays.length > 0) {
      window.avaDay = datesCcMap
    }

    let inputDate_formatted = e
    let selectedDate_formatted = selectedDate.format(dateFormat)

    if (inputDate_formatted !== selectedDate_formatted) {
      const { maxcc } = Store.current
      let cc = window.avaDay[inputDate_formatted]

      if (cc !== undefined && cc > maxcc) Store.setMaxcc(cc)
      Store.setDate(moment(inputDate_formatted))
    }
  }

  toggleLayer = on => {
    this.map.wrappedInstance.toggleMainLayer(on)
  }

  getContent() {
    if (this.state.isLoaded) {
      const { error } = this.state
      const { presetsLegend, devMode, preset, activeDatasource, noCredentials } = Store.current
      const presetLegend = _.find(presetsLegend, value => preset == value.name)

      return (
        <div>
          <Map ref={e => (this.map = e)} />
          <div id="head">
            <div />
          </div>
          <div id="Controls" className={!this.state.toolsVisible && 'hidden'}>
            <div id="ControlsContent">
              <div className="pull-right half-size">
                <div>
                  <button onClick={this.doGenerate} className="btn1">
                    <i className="fa fa-share-alt" />
                  </button>
                </div>
                <DummyIcon />
                <div className="clear-both-700" />
                <SearchBox
                  onLocationPicked={data => this.setMapLocation(data)}
                  toolsVisible={this.state.toolsVisible}
                />

                <div className="dev-tools-clear-1050" />
              </div>
              <div className="clear-both-700" />
              <div className="pull-left half-size pull-right-700">
                <DatePicker
                  id="dateFloat"
                  icon="calendar"
                  onNavClick={this.queryDates}
                  onSelect={e => this.handleDatePickerOnSelect(e)}
                  isVisible={this.state.isDateVisible}
                  onExpand={() => this.queryDates(true)}
                />
                {activeDatasource.name !== 'MODIS' && <CloudSlider onExpand={() => this.queryDates(true)} />}
                <div className="clear-both-700" />
              </div>
            </div>
          </div>

          <a
            id="toggleSettings"
            className={!this.state.toolsVisible && 'hidden'}
            onClick={() => this.setState({ toolsVisible: !this.state.toolsVisible })}
          >
            <i className={'fa fa-' + (this.state.toolsVisible ? 'chevron-left' : 'cogs')} />
          </a>
          <Tools
            onResize={this.onResize}
            doGenerate={this.doGenerate}
            className={!this.state.toolsVisible && 'hidden'}
            toggleLegendModal={this.toggleLegendModal}
          />
          <DatasourceSwitch onToggle={this.toggleLayer} onError={error => this.setState({ error })} />
          <Rodal
            animation="slideUp"
            visible={this.state.isModal}
            width={Store.current.size[0] - 80}
            height={Store.current.size[1] - 100}
            onClose={this.hideModal}
          >
            {this.state.isModal && <GenerateImgPanel imgUrl={Store.current.imgWmsUrl} onCopy={this.onCopy} />}
          </Rodal>

          {error && (
            <Rodal animation="slideUp" visible={true} width={400} height={100} onClose={this.hideModal}>
              <h3>Error</h3>
              {error}
            </Rodal>
          )}

          <Draggable
            handle=".handle"
            defaultPosition={{ x: window.innerWidth - 173, y: 77 }}
            bounds="#root"
            position={null}
          >
            <div
              className="handle legendModal"
              style={{
                display: Store.current.legendVisible ? 'inline-block' : 'none'
              }}
            >
              {!this.state.legendDataLoaded &&
                presetLegend && (
                  <div>
                    <i className="fa fa-spinner fa-pulse" />
                    <span>&nbsp;Loading...</span>
                  </div>
                )}

              {this.state.legendDataLoaded && (
                <p>
                  {Store.current.presets && Store.current.presets[Store.current.preset].name}
                  <i className="fa fa-close" onClick={() => Store.setLegendVisiblity(false)} />
                </p>
              )}

              {Store.current.legendVisible && (
                <PlaygroundLegend
                  link={Store.current.legendObj}
                  onLoad={this.handleModalSuccess}
                  onError={this.handleModalError}
                />
              )}

              {this.state.legendDataError && (
                <p>
                  There was an error
                  <br />
                  while downloading data
                  <br />
                  for the legend.
                </p>
              )}
            </div>
          </Draggable>
          <div className={`copyNotification ${this.state.isCopied && 'visible'}`}>
            <i className="fa fa-check-circle" />
            Url successfully copied to clipboard!
          </div>
        </div>
      )
    } else if (this.state.loadError) {
      return (
        <div id="loading">
          <div className="notification">
            <i className="fa fa-exclamation-circle" />
            <h2>Error</h2>
            <small>{this.state.loadMessage}</small>
          </div>
        </div>
      )
    } else {
      return (
        <div id="loading">
          <i className="fa fa-cog fa-spin fa-3x fa-fw" />Loading ...
        </div>
      )
    }
  }
}

export default connect(store => store)(keydown(App))
