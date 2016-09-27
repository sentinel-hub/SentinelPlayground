import React from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import _ from 'lodash'
import NProgress from 'nprogress'
import {queryAvailableDates} from '../utils/ajax'
import Store from '../store'
import {connect} from 'react-redux'
import {EventEmitter} from 'fbemitter'
import 'nprogress/nprogress.css'


const styles = {
  map: {
    width: '100%',
    bottom: '0px',
    top: '0px',
    position: 'absolute',
    margin: 0
  }
}
var sentL;

class RootMap extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeLayers: []
    }

    this.events = new EventEmitter()
  }

  componentDidMount() {
    const {serviceWmsUrl, mapId, center, zoom} = this.props

    var osm = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      name: 'osm'
    })
    sentL = L.tileLayer.wms(`${serviceWmsUrl}?showLogo=false`, {
      attribution: '&copy; <a href="http://www.sentinel-hub.com" target="_blank">Sentinel layer</a> contributors',
      tileSize: 512,
      crs: L.CRS.EPSG4326,
      minZoom: 6,
      maxZoom: 16,
      name: 'sentinel2',
      prettyName: 'Sentinel 2'
    })

    NProgress.configure({
      showSpinner: false,
      parent: `#${mapId}`
    });


    sentL.on('load', function (e) {
      NProgress.done();
    })
    sentL.on('loading', function (e) {
      NProgress.start();
      NProgress.inc(0.3);
    })
    sentL.on('tileerror', function (e) {
      NProgress.done();
    })

    let sentinelMap = L.map(mapId, {
      center: center,
      zoom,
      layers: [osm, sentL]
    })
    window.sgmap = sentinelMap

    var overlayMaps = {
      "Sentinel 2": sentL
    };

    L.control.layers(null,overlayMaps).addTo(sentinelMap)

    sentinelMap.zoomControl.setPosition('bottomright')
    sentinelMap.on('moveend', () => {
      Store.setMapBounds(sentinelMap.getBounds())
      Store.setLat(sentinelMap.getCenter().lat)
      Store.setLng(sentinelMap.getCenter().lng)
      Store.setZoom(sentinelMap.getZoom())
      this.handleMoveEnd(sentinelMap.getBounds())
    })

    sentinelMap.on('overlayadd', (e) => {
     this.writeCurrActiveLayer(e.layer.options)
    })


    sentinelMap.on('overlayremove', (e) => {
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
    }).addTo(sentinelMap)

    sentinelMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom)
    queryAvailableDates(sentinelMap.getBounds())
    this.events.emit('ready', sentinelMap)
  }

  componentDidUpdate(nextProp, nextState) {
    if (_.get(this, 'props.action.type') === 'REFRESH' && !_.isEqual(this.props, nextProp)) {
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
    return this.isCustom() ? _.values(Store.current.layers).join(",") : Store.current.preset
  }


  updateSentinelLayer() {
    let format = Store.current.dateFormat
    let date = `${Store.current.minDate}/${Store.current.selectedDate.format(format)}`;
    let colcors = Store.current.colCor
    let layers = this.getLayersString()
    let evalS = ''
    if (this.isCustom()) {
      if (Store.current.evalscript !== '') {
        evalS = Store.current.evalscript
      }
      colcors += ",BOOST"
    }

    sentL.setParams({
      maxcc: Store.current.maxcc,
      layers: layers,
      priority: Store.current.priority,
      gain: Store.current.gain,
      evalscript: evalS,
      COLCOR: colcors,
      CLOUDCORRECTION: Store.current.cloudCorrection,
      time: date
    });
  }

  handleMoveEnd(bounds) {
    queryAvailableDates(bounds)
  }

  render() {
    return <div style={styles.map} id={this.props.mapId}>
        <a id="aboutSentinel" target="_blank" href="http://www.sentinel-hub.com">About Sentinel Hub</a>
      </div>
  }
}

export default connect(store => store)(RootMap)
