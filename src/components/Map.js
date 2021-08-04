import React from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import _ from 'lodash';
import NProgress from 'nprogress';
import Store from '../store';
import { connect } from 'react-redux';
import { queryDates } from '../utils/datesHelper';
import 'nprogress/nprogress.css';
import { getMapParameters } from '../utils/utils';
import { SentinelHub } from '../utils/sentinehub';

const styles = {
  map: {
    width: '100%',
    bottom: '0px',
    top: '0px',
    position: 'absolute',
    margin: 0
  }
};

class RootMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeLayers: [],
      mapId: 'mainMap'
    };
    this.sentL = null;
    this.mainMap = null;
    this.mapControls = null;
    this.progress = null;
  }

  componentDidMount() {
    const { mapId } = this.state;
    const { center, zoom } = this.props;

    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    this.mainMap = L.map(mapId, {
      center: center,
      attributionControl: false,
      zoom,
      minZoom: 3,
      maxZoom: 16,
      layers: [osm]
    });

    this.progress = NProgress.configure({
      showSpinner: false,
      parent: `#${mapId}`
    });

    var overlayMaps = {
      // 'Sentinel 2': this.sentL
    };

    // this.mapControls = L.control.layers(null, overlayMaps).addTo(this.mainMap)
    this.drawActiveLayer();

    this.mainMap.zoomControl.setPosition('topright');
    this.mainMap.on('moveend', () => {
      Store.setMapBounds(this.mainMap.getBounds());
      Store.setLat(this.mainMap.getCenter().lat);
      Store.setLng(this.mainMap.getCenter().wrap().lng);
      Store.setZoom(this.mainMap.getZoom());
    });

    this.mainMap.on('overlayadd', e => {
      this.writeCurrActiveLayer(e.layer.options);
    });

    this.mainMap.on('overlayremove', e => {
      let arr = this.state.activeLayers;
      // _.pull(arr, e.layer.options.name)
      this.setState({ activeLayers: arr });
      if (this.state.activeLayers.length > 0) {
        this.writeCurrActiveLayer(e.layer.options);
      } else {
        NProgress.done();
      }
    });

    L.control
      .scale({
        updateWhenIdle: true,
        imperial: false,
        position: 'bottomright'
      })
      .addTo(this.mainMap);

    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom);
  }

  componentDidUpdate(prevProps) {
    if (_.get(this, 'props.action.type') === 'REFRESH' && !_.isEqual(this.props, prevProps)) {
      this.drawActiveLayer();
    }
    if (prevProps.action.type === 'SET_DATASOURCE') {
      this.drawActiveLayer();
    }
    if (prevProps.showDates !== Store.current.showDates) {
      this.drawActiveLayer();
    }
    if (prevProps.recaptchaAuthToken !== this.props.recaptchaAuthToken && this.sentinelHubLayer) {
      this.sentinelHubLayer.updateToken(this.props.recaptchaAuthToken);
    }
  }

  writeCurrActiveLayer(options) {
    Store.setActiveBaseLayer(options.prettyName, {
      min: options.minZoom,
      max: options.maxZoom
    });
  }
  isCustom() {
    return Store.current.preset === 'CUSTOM';
  }

  updatePosition() {
    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom);
  }

  drawActiveLayer() {
    if (this.sentL) {
      // this.mapControls.removeLayer(this.sentL)
      this.mainMap.removeLayer(this.sentL);
    }
    const {
      activeDatasource: { min }
    } = Store.current;
    const { url, urlProcessingApi, ...params } = getMapParameters();
    this.sentL = L.tileLayer.wms(`${url}?showLogo=false`, {
      attribution: '&copy; <a href="https://www.sentinel-hub.com" target="_blank">Sentinel Hub</a>',
      tileSize: 512,
      minZoom: min,
      ...params
    });

    this.sentL.on('loading', e => {
      this.progress.start();
      this.progress.inc(0.3);
    });

    this.sentL.on('load', e => {
      this.progress.done();
    });

    this.sentL.on('tileerror', e => {
      this.progress.done();
    });

    const { recaptchaAuthToken, setTokenShouldBeUpdated } = this.props;
    this.sentinelHubLayer = new SentinelHub(url, urlProcessingApi, recaptchaAuthToken);
    const sentinelhubLayer = this.sentinelHubLayer; // hack because of how this and non-arrow functions work
    this.sentL.createTile = function(coords, done) {
      const tile = L.DomUtil.create('canvas', 'leaflet-tile');
      tile.width = tile.height = this.options.tileSize;
      const tileSize = tile.width;
      const nwPoint = coords.multiplyBy(tileSize);
      const sePoint = nwPoint.add([tileSize, tileSize]);

      // new API expects bbox to be in CRS84:
      const nw = this._crs.project(this._map.unproject(nwPoint, coords.z));
      const se = this._crs.project(this._map.unproject(sePoint, coords.z));
      const bbox =
        this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326
          ? [se.y, nw.x, nw.y, se.x]
          : [nw.x, se.y, se.x, nw.y];
      sentinelhubLayer
        .getMap({
          ...params,
          showLogo: false,
          width: tileSize,
          height: tileSize,
          bbox: bbox,
          format: 'image/jpeg',
          crs: this._crs.code
        })
        .then(blob => {
          const imageObj = new Image();
          imageObj.crossOrigin = '';
          imageObj.onload = function() {
            const ctx = tile.getContext('2d');
            ctx.drawImage(imageObj, 0, 0);
            URL.revokeObjectURL(imageObj.src);
            done(null, tile);
          };
          const objectURL = URL.createObjectURL(blob);
          imageObj.src = objectURL;
        })
        .catch(function(error) {
          if (error.response && error.response.status === 401) {
            setTokenShouldBeUpdated(true);
          }
          console.log('There has been a problem with your fetch operation: ', error.message);
          done(error, null);
        });

      return tile;
    };

    this.mainMap.addLayer(this.sentL);
    // this.mapControls.addOverlay(this.sentL, name)
  }

  toggleMainLayer = on => {
    if (!on) {
      this.mainMap.addLayer(this.sentL);
    } else {
      this.mainMap.removeLayer(this.sentL);
    }
  };

  render() {
    return (
      <div style={styles.map} id={this.state.mapId}>
        <a
          id="openstreetmap_link"
          className="linki"
          target="_blank"
          href="http://www.openstreetmap.org/copyright"
        >
          OpenStreetMap
        </a>
        <a
          id="copyright_link"
          className="linki"
          target="_blank"
          href="https://www.sentinel-hub.com"
        >
          © Sentinel Hub
        </a>
      </div>
    );
  }
}

export default connect(
  store => store,
  null,
  null,
  { withRef: true }
)(RootMap);
