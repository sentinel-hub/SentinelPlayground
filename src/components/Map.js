import React from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import _ from 'lodash'
import NProgress from 'nprogress'
import Store from '../store'
import { connect } from 'react-redux'
import 'nprogress/nprogress.css'
import { getMultipliedLayers } from '../utils/utils'

const styles = {
  map: {
    width: '100%',
    bottom: '0px',
    top: '0px',
    position: 'absolute',
    margin: 0
  }
}

class RootMap extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeLayers: [],
      mapId: 'mainMap'
    }
    this.sentL = null
    this.mainMap = null
    this.mapControls = null
  }

  componentDidMount() {
    const { mapId } = this.state
    const { center, zoom } = this.props

    var osm = L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    const { name, min = 6, max = 16, id } = Store.current.activeDatasource

    this.mainMap = L.map(mapId, {
      center: center,
      attributionControl: false,
      zoom,
      maxZoom: 16,
      layers: [osm]
    })

    var overlayMaps = {
      // 'Sentinel 2': this.sentL
    }

    // this.mapControls = L.control.layers(null, overlayMaps).addTo(this.mainMap)
    this.drawActiveLayer()

    this.mainMap.zoomControl.setPosition('topright')
    this.mainMap.on('moveend', () => {
      Store.setMapBounds(this.mainMap.getBounds())
      Store.setLat(this.mainMap.getCenter().lat)
      Store.setLng(this.mainMap.getCenter().wrap().lng)
      Store.setZoom(this.mainMap.getZoom())
    })

    this.mainMap.on('overlayadd', e => {
      this.writeCurrActiveLayer(e.layer.options)
    })

    this.mainMap.on('overlayremove', e => {
      let arr = this.state.activeLayers
      _.pull(arr, e.layer.options.name)
      this.setState({ activeLayers: arr })
      if (this.state.activeLayers.length > 0) {
        this.writeCurrActiveLayer(e.layer.options)
      } else {
        NProgress.done()
      }
    })

    L.control
      .scale({
        updateWhenIdle: true,
        imperial: false,
        position: 'bottomright'
      })
      .addTo(this.mainMap)

    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom)
  }

  componentDidUpdate(nextProp, nextState) {
    if (_.get(this, 'props.action.type') === 'REFRESH' && !_.isEqual(this.props, nextProp)) {
      this.drawActiveLayer()
    }
    if (nextProp.action.type === 'SET_DATASOURCE'/* || nextProp.action.type === 'SET_PRESETS'*/) {
      this.drawActiveLayer()
    }
    if (nextProp.showDates !== Store.current.showDates) {
      this.drawActiveLayer()
    }
  }

  writeCurrActiveLayer(options) {
    Store.setActiveBaseLayer(options.prettyName, { min: options.minZoom, max: options.maxZoom })
  }
  isCustom() {
    return Store.current.preset === 'CUSTOM'
  }
  getLayersString() {
    let isDate = Store.current.showDates ? ',DATE' : ''
    return (this.isCustom() ? Object.keys(Store.current.presets)[1] : Store.current.preset) + isDate
  }

  updatePosition() {
    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom)
  }

  drawActiveLayer() {
    const {
      selectedDate,
      activeDatasource: { minDate, min, max, name, on = true, url },
      dateFormat,
      evalscripturl,
      atmFilter,
      evalscript,
      layers,
      isEvalUrl,
      gain,
      gamma
    } = Store.current
    const { mapId } = this.state
    let date = `${minDate}/${selectedDate.format(dateFormat)}`
    let layersString = this.getLayersString()
    let paramObj = { }
    let evalS = ''
    // delete this.sentL.wmsParams.evalscript
    if (this.isCustom()) {
      
        evalS = evalscript
        
        // if (evalS !== '') {
        //   Store.setRenderedEvalscript(evalS)
        // }
        
        paramObj.evalscript = evalS
        paramObj.evalsource = Store.current.activeDatasource.id
        
      // } else {
      //   //set rendered evalscript to ''
      //   Store.setRenderedEvalscript('')
      // }
      if (evalscripturl !== '' && isEvalUrl) {
        paramObj.evalscripturl = evalscripturl
        paramObj.evalscript = ''
      } 
      paramObj.PREVIEW = 3
    } else {
      Store.setRenderedEvalscript('')
      paramObj.layers = layersString
    }
    new Number(gain).toFixed(1) !== '1.0' && (paramObj.gain = gain)
    new Number(gamma).toFixed(1) !== '1.0' && (paramObj.gamma = gamma)
    atmFilter && (paramObj.atmFilter = atmFilter)

    if (this.sentL) {
      // this.mapControls.removeLayer(this.sentL)
      this.mainMap.removeLayer(this.sentL)
    }
    this.sentL = L.tileLayer.wms(`${url}?showLogo=false`, {
      attribution: '&copy; <a href="http://www.sentinel-hub.com" target="_blank">Sentinel Hub</a>',
      tileSize: 512,
      minZoom: min,
      maxZoom: max,
      name: name,
      layers: layersString,
      maxcc: Store.current.maxcc,
      time: date,
      ...paramObj
    })

    this.mainMap.addLayer(this.sentL)
    // this.mapControls.addOverlay(this.sentL, name)

    NProgress.configure({
      showSpinner: false,
      parent: `#${mapId}`
    })

    this.sentL.on('load', function(e) {
      NProgress.done()
    })
    this.sentL.on('loading', function(e) {
      NProgress.start()
      NProgress.inc(0.3)
    })
    this.sentL.on('tileerror', function(e) {
      NProgress.done()
    })
  }

  toggleMainLayer = on => {
    if (!on) {
      this.mainMap.addLayer(this.sentL)
    } else {
      this.mainMap.removeLayer(this.sentL)
    }
  }

  render() {
    return (
      <div style={styles.map} id={this.state.mapId}>
        <a id="openstreetmap_link" className="linki" target="_blank" href="http://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a>
        <a id="copyright_link" className="linki" target="_blank" href="http://www.sentinel-hub.com">
          © Sentinel Hub
        </a>
      </div>
    )
  }
}

export default connect(store => store, null, null, { withRef: true })(RootMap)
