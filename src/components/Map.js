import React from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import _ from 'lodash'
import NProgress from 'nprogress'
import Store from '../store'
import {connect} from 'react-redux'
import 'nprogress/nprogress.css'
import {getMultipliedLayers} from '../utils/utils'
import {whichVisualizationDoISee, isRgbNull} from '../utils/activeView'


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
      activeLayers: []
    }
    this.sentL = null
    this.mainMap = null
  }

  componentDidMount() {
    const {mapId, center, zoom} = this.props

    var osm = L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    this.sentL = L.tileLayer.wms(`${Store.getWmsUrl}?showLogo=false`, {
      attribution: '&copy; <a href="http://www.sentinel-hub.com" target="_blank">Sentinel Hub</a>',
      tileSize: 512,
      minZoom: 7,
      layers: Store.current.preset,
      maxZoom: 16,
      name: 'sentinel2',
      prettyName: 'Sentinel 2'
    })

    NProgress.configure({
      showSpinner: false,
      parent: `#${mapId}`
    });


    this.sentL.on('load', function (e) {
      NProgress.done();
    })
    this.sentL.on('loading', function (e) {
      NProgress.start();
      NProgress.inc(0.3);
    })
    this.sentL.on('tileerror', function (e) {
      NProgress.done();
    })

    this.mainMap = L.map(mapId, {
      center: center,
      zoom,
      layers: [osm]
    })

    var overlayMaps = {
      "Sentinel 2": this.sentL
    };

    this.updateSentinelLayer();
    let control = L.control.layers(null,overlayMaps).addTo(this.mainMap)

    this.mainMap.zoomControl.setPosition('bottomright')
    this.mainMap.on('moveend', () => {
      Store.setMapBounds(this.mainMap.getBounds())
      Store.setLat(this.mainMap.getCenter().lat)
      Store.setLng(this.mainMap.getCenter().wrap().lng)
      Store.setZoom(this.mainMap.getZoom())
    })

    this.mainMap.on('overlayadd', (e) => {
     this.writeCurrActiveLayer(e.layer.options)
    })


    this.mainMap.on('overlayremove', (e) => {
      let arr = this.state.activeLayers
      _.pull(arr, e.layer.options.name)
      this.setState({activeLayers: arr})
      if (this.state.activeLayers.length > 0) {
        this.writeCurrActiveLayer(e.layer.options)
      } else {
        NProgress.done();
      }
    })

    L.control.scale({
      updateWhenIdle: true,
      imperial: false,
      position: "bottomleft"
    }).addTo(this.mainMap)

    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom)
  }

  componentDidUpdate(nextProp, nextState) {
    if (_.get(this, 'props.action.type') === 'REFRESH' && !_.isEqual(this.props, nextProp)) {
      this.updateSentinelLayer()
    }
    if (nextProp.showDates !== Store.current.showDates) {
      this.updateSentinelLayer()
    }
  }
  writeCurrActiveLayer(options) {
    Store.setActiveBaseLayer(options.prettyName, {min: options.minZoom, max: options.maxZoom})
  }
  isCustom() {
    return Store.current.preset === 'CUSTOM'
  }
  getLayersString() {
    let isDate = Store.current.showDates ? ",DATE" : ""
    return (this.isCustom() ? _.values(Store.current.layers).join(",") : Store.current.preset) + isDate
  }

  updatePosition() {
    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom);
  }
  
  updateSentinelLayer() {
    const {renderedEvalScript, views} = Store.current
    let format = Store.current.dateFormat
    let date = `${Store.current.minDate}/${Store.current.selectedDate.format(format)}`;
    let atmFilter = Store.current.atmFilter
    let layers = this.getLayersString()
    let isEvalScriptFromLayers = Store.current.evalscript === btoa("return [" + getMultipliedLayers(Store.current.layers) + "]")
    let paramObj = {}
    let evalS = ''
    delete this.sentL.wmsParams.evalscript
    if (this.isCustom()) {
      if (!isEvalScriptFromLayers) {
        evalS = Store.current.evalscript

        // set rendered evalscript to something
        if(evalS !== '') {
          Store.setRenderedEvalscript(evalS)
        } 

        paramObj.evalscript = evalS
        paramObj.evalsource = Store.current.source || 'S2'
      } else {
        //set rendered evalscript to ''
        Store.setRenderedEvalscript('')
      }
      paramObj.PREVIEW = 3
    } else {
      Store.setRenderedEvalscript('')
    }
    paramObj.maxcc = Store.current.maxcc
    paramObj.layers = layers
    paramObj.priority = Store.current.priority
    paramObj.gain = Store.current.gain
    paramObj.gamma = Store.current.gamma
    paramObj.ATMFILTER = atmFilter
    paramObj.CLOUDCORRECTION = Store.current.cloudCorrection
    paramObj.time = date
    if (!this.mainMap.hasLayer(this.sentL)) {
       this.mainMap.addLayer(this.sentL)
    }

    if(whichVisualizationDoISee() === views.BANDS && isRgbNull()) {
      this.sentL.setOpacity(0)      
      delete paramObj.layers
    } else {
      this.sentL.setOpacity(1)
    }

    this.sentL.setParams(paramObj);
  }

  render() {
    return <div style={styles.map} id={this.props.mapId}>
        <a id="aboutSentinel" target="_blank" href="http://www.sentinel-hub.com">About Sentinel Hub</a>
      </div>
  }
}

export default connect(store => store, null, null, { withRef: true })(RootMap)
