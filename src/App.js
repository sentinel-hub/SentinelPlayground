import React, { Component } from 'react';
import Map from './components/Map';
import Tools from './components/Tools';
import DatePicker from './components/DatePicker';
import CloudSlider from './components/CloudSlider';
import SearchBox from './components/SearchBox';
import DummyIcon from './components/DummyIcon';
import DevTools from './components/DevTools';
import PlaygroundLegend from './components/PlaygroundLegend';
import DevCodeSnippets from './components/DevCodeSnippets';
import GenerateImgPanel from './components/GenerateImgPanel';
import { loadGetCapabilities } from './utils/ajax';
import { queryDates, getClosestNextDate } from './utils/datesHelper';
// import 'flatpickr/dist/themes/material_blue.css'
// import Flatpickr from 'react-flatpickr'
import { getPolyfill, b64EncodeUnicode, isMultiTemporalDeploy } from './utils/utils';
import Rodal from 'rodal';
import 'rodal/lib/rodal.css';
import keydown from 'react-keydown';
import moment from 'moment';
import _ from 'lodash';
import { connect } from 'react-redux';
import Store from './store';
import Draggable from 'react-draggable';
import './App.scss';
import DatasourceSwitch from './components/DatasourceSwitch';
import axios from 'axios';
import banner1 from './custom_script.png';
import banner2 from './eobrowser.png';
import banner3 from './gis.png';

import AuthWindow from './components/AuthWindow';
import TermsAndPrivacyConsentForm from './components/TermsAndPrivacyConsent/TermsAndPrivacyConsentForm';

let oldUrl = null;
try {
  oldUrl = window.location.href;
} catch (e) {}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      showImage: false,
      isDateVisible: false,
      toolsVisible: true,
      isCopied: false,
      error: null,
      legendDataLoaded: false,
      legendDataError: false,
      tokenShouldBeUpdated: true
    };
    this.paramsMap = this.getParamsFromPath();
    getPolyfill();
    const { lat, lng, zoom } = this.paramsMap;
    _.merge(Store.current, { lat, lng, zoom });
  }

  getParamsFromPath = () => {
    const hasSearch = window.location.href.includes('?');
    var path = hasSearch ? window.location.search : window.location.hash.replace(/^#\/?|\/$/g, '');
    if (hasSearch) {
      path = path.replace('?', '');
    }
    path = path.replace('%7C', '/');
    Store.current.path = path;
    let paramsMap = {};
    let params = path.split('&');
    params.forEach(p => {
      const [key, value] = p.split('=');
      paramsMap[key] = key === 'showImage' ? true : value;
    });
    return paramsMap;
  };

  onResize = () => {
    Store.setSize([window.innerWidth, window.innerHeight]);
  };

  componentDidMount() {
    const datasourceAndParams = this.createDatasourceAndParams();
    _.merge(Store.current, datasourceAndParams);

    queryDates()
      .then(res => {
        Store.setNextDate(getClosestNextDate(false));
        Store.setPrevDate(getClosestNextDate(true));
      })
      .catch(e => {
        console.error(e);
      });
    const activeDS = Store.current.activeDatasource;
    loadGetCapabilities(activeDS, true)
      .then(() => {
        this.setState({
          isLoaded: true,
          isModal: false,
          isLegendModal: false
        });
        this.handleUrl();

        if (this.state.showImage) {
          this.doGenerate();
        }
      })
      .catch(e => {
        this.setState({
          error: `Could not load data for ${activeDS.name}. Try selecting a different collection.`,
          isLoaded: true
        });
        console.error(e);
      });
    Store.setSize([window.innerWidth, window.innerHeight]);
  }

  componentWillReceiveProps({ keydown }) {
    if (keydown.event) {
      if (keydown.event.code === 'Escape') {
        this.setState({
          isDateVisible: false,
          isCloudVisible: false
        });
        this.hideModal();
        this.hideLegendModal();
      }
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.preset !== Store.current.preset) {
      this.setState({
        legendDataLoaded: false,
        legendDataError: false
      });
    }
  }

  hideModal = () => {
    this.setState({ isModal: false, error: null });
  };
  hideLegendModal = () => {
    this.setState({ isLegendModal: false });
  };
  toggleLegendModal = e => {
    this.setState({
      isLegendModal: !this.state.isLegendModal
    });
  };

  setMapLocation = mapboxSearchResponse => {
    const [lng, lat] = mapboxSearchResponse.location;
    Store.setLat(lat);
    Store.setLng(lng);
    this.map.wrappedInstance.mainMap.setView([lat, lng], Store.current.zoom);
  };

  doGenerate = () => {
    Store.generateImgDownloadParams();
    this.setState({ isModal: true, showImage: false });
  };

  parseEvalscript = value => {
    try {
      atob(window.decodeURIComponent(value));
      Store.setEvalScript(window.decodeURIComponent(value)); // + "==";
      Store.setCurrentView('3');
    } catch (e) {
      console.log('Could not parse evalscript:' + e.message, value);
    }
  };

  createDatasourceAndParams = () => {
    const {
      instanceID,
      baseWmsUrl,
      layerMap,
      source,
      http,
      time,
      gain,
      gamma,
      lat,
      layers,
      lng,
      zoom,
      showDates,
      maxcc,
      atmFilter,
      temporal
    } = this.paramsMap;
    const { datasources } = Store.current;
    let lmValue = '';
    if (layerMap) {
      const [first] = layerMap.split(';');
      const [, dsValue] = first.split(',');
      lmValue = dsValue;
    }
    const defaultDatasource = datasources.find(ds => ds.datasourceID === 'S2L2A'); // fallback is S2L2A
    const datasource = datasources.find(ds => ds.id === (source || lmValue)) || defaultDatasource;
    const { minDate, maxDate = moment(), id } = datasource;
    let obj = {};
    const selectedDate = moment(time && time.split('/')[1]);
    if (moment(maxDate).isBefore(selectedDate)) {
      obj['selectedDate'] = moment(maxDate);
    }
    Store.setDate(selectedDate);
    obj['activeDatasource'] = { ...datasource };
    if (instanceID) {
      const noHttps = http === 'true' || baseWmsUrl.includes('eocloud');
      obj['devMode'] = true;
      const isNew = baseWmsUrl === 'services.sentinel-hub.com' || baseWmsUrl.includes('uswest2');
      obj.activeDatasource.url = `${noHttps ? 'http' : 'https'}://${baseWmsUrl}/${
        isNew ? 'ogc' : 'v1'
      }/wms/${instanceID}`;
      obj.activeDatasource.private = true;
    }
    const params = {
      gain,
      gamma,
      lat,
      baseWmsUrl,
      instanceID,
      lng,
      zoom,
      showDates: showDates && showDates === 'true',
      maxcc,
      evalsource: id,
      source: id,
      minDate,
      maxDate: moment(maxDate),
      //  selectedDate,
      atmFilter,
      ...{ layers: layers ? this.getLayers(layers) : null },
      ...obj
    };

    if (isMultiTemporalDeploy()) {
      params.temporal = !!temporal;
    }
    return params;
  };

  getLayers = value => {
    const [r, g, b] = value.split(',');
    const layers = { r, g, b };
    return layers;
  };

  handleUrl = () => {
    const { evalscript, evalscripturl, preset, showImage } = this.paramsMap;
    preset && Store.setPreset(preset);
    evalscript && evalscript !== '' && this.parseEvalscript(evalscript);
    evalscripturl && this.loadEvalscript(evalscripturl);
    showImage && this.doGenerate();
  };
  getDates = from => {
    queryDates(from)
      .then(res => {
        Store.setAvailableDates(res);
        Store.setPrevDate(getClosestNextDate(true));
        Store.setNextDate(getClosestNextDate(false));
      })
      .catch(e => {
        console.error(e);
      });
  };
  loadEvalscript = value => {
    const url = window.decodeURIComponent(value);
    axios
      .get(url)
      .then(res => {
        try {
          Store.setEvalScript(b64EncodeUnicode(res.data));
          Store.setEvalUrl(url);
          Store.setPreset('CUSTOM');
          Store.setCurrentView('3');
        } catch (e) {
          Store.setEvalUrl(url);
        }
      })
      .catch(e => console.error(e));
  };

  onCopy = () => {
    this.setState({ isCopied: true });
    setTimeout(() => {
      this.setState({ isCopied: false });
    }, 3000);
  };

  handleModalSuccess = () => {
    this.setState({
      legendDataLoaded: true,
      legendDataError: false
    });
  };

  handleModalError = () => {
    this.setState({
      legendDataLoaded: true,
      legendDataError: true
    });
  };

  handleDatePickerOnSelect = e => {};

  toggleLayer = on => {
    this.map.wrappedInstance.toggleMainLayer(on);
  };

  setAuthToken = token => {
    this.setTokenShouldBeUpdated(false);
    Store.setRecaptchaAuthToken(token);
  };

  setTokenShouldBeUpdated = shouldBeUpdated => {
    this.setState({ tokenShouldBeUpdated: shouldBeUpdated });
  };

  getContent() {
    if (this.state.isLoaded) {
      const { error } = this.state;
      const {
        presetsLegend,
        devMode,
        preset,
        activeDatasource,
        imgDownloadBaseUrl,
        imgDownloadWmsParams,
        termsPrivacyAccepted
      } = Store.current;
      const presetLegend = _.find(presetsLegend, value => preset == value.name);

      return (
        <div>
          {!termsPrivacyAccepted && <TermsAndPrivacyConsentForm />}

          {termsPrivacyAccepted && (
            <AuthWindow
              setToken={this.setAuthToken}
              tokenShouldBeUpdated={this.state.tokenShouldBeUpdated}
              setTokenShouldBeUpdated={this.setTokenShouldBeUpdated}
            />
          )}

          <Map ref={e => (this.map = e)} setTokenShouldBeUpdated={this.setTokenShouldBeUpdated} />

          <div className="footer">
            <a
              href="https://www.sentinel-hub.com/develop/custom-scripts/"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-footer"
            >
              <img src={banner1} alt="banner1" />
            </a>
            <a
              href="https://apps.sentinel-hub.com/eo-browser/"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-footer"
            >
              <img src={banner2} alt="banner2" />
            </a>
            <a
              href="https://www.sentinel-hub.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="banner-footer"
            >
              <img src={banner3} alt="banner3" />
            </a>
          </div>
          <div id="head">
            <div />
          </div>
          <div id="Controls" className={!this.state.toolsVisible && 'hidden'}>
            <div id="ControlsContent">
              <div className="pull-right half-size">
                {/* <div>
                  <button onClick={this.doGenerate} className="btn1">
                    <i className="fa fa-share-alt" />
                  </button>
                </div> */}

                <DummyIcon />

                <div className="clear-both-700" />
                <SearchBox
                  onLocationPicked={this.setMapLocation}
                  toolsVisible={this.state.toolsVisible}
                />

                <div className="dev-tools-clear-1050" />
                {devMode && <DevTools insertClass="leftOne" />}
              </div>
              <div className="clear-both-700" />
              <div className="pull-left half-size pull-right-700">
                <DatePicker
                  id="dateFloat"
                  icon="calendar"
                  onNavClick={from => this.getDates(from)}
                  onSelect={e => this.handleDatePickerOnSelect(e)}
                  isVisible={this.state.isDateVisible}
                  onExpand={e => this.getDates(e)}
                />
                {!!activeDatasource.cloudCoverageSupported && <CloudSlider />}
                <div className="clear-both-700" />
                {devMode && <DevTools insertClass="rightOne" />}
              </div>
            </div>
          </div>

          <a
            id="toggleSettings"
            className={!this.state.toolsVisible && 'hidden'}
            onClick={() =>
              this.setState({
                toolsVisible: !this.state.toolsVisible
              })
            }
          >
            <i className={'fa fa-' + (this.state.toolsVisible ? 'chevron-left' : 'cogs')} />
          </a>
          <Tools
            onResize={this.onResize}
            doGenerate={this.doGenerate}
            className={!this.state.toolsVisible && 'hidden'}
            toggleLegendModal={this.toggleLegendModal}
          />
          <DatasourceSwitch
            onToggle={this.toggleLayer}
            onError={error => this.setState({ error })}
          />
          <Rodal
            animation="slideUp"
            visible={this.state.isModal}
            width={Store.current.size[0] - 80}
            height={Store.current.size[1] - 100}
            onClose={this.hideModal}
          >
            {this.state.isModal && (
              <GenerateImgPanel
                baseUrl={imgDownloadBaseUrl}
                wmsParams={imgDownloadWmsParams}
                onCopy={this.onCopy}
              />
            )}
          </Rodal>

          {error && (
            <Rodal
              animation="slideUp"
              visible={true}
              width={400}
              height={100}
              onClose={this.hideModal}
            >
              <h3>Error</h3>
              {error}
            </Rodal>
          )}

          {Store.current.devMode && Store.current.devModalVisible && (
            <Rodal
              animation="slideUp"
              visible={Store.current.devModalVisible}
              width={Store.current.size[0] - 80}
              height={Store.current.size[1] - 100}
              onClose={() => Store.setDevModalVisibility(false)}
            >
              <DevCodeSnippets />
            </Rodal>
          )}

          <Draggable
            handle=".handle"
            defaultPosition={{
              x: window.innerWidth - 173,
              y: 77
            }}
            bounds="#root"
            position={null}
          >
            <div
              className="handle legendModal"
              style={{
                display: Store.current.legendVisible ? 'inline-block' : 'none'
              }}
            >
              {!this.state.legendDataLoaded && presetLegend && (
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
      );
    } else if (this.state.loadError) {
      return (
        <div id="loading">
          <div className="notification">
            <i className="fa fa-exclamation-circle" />
            <h2>Error</h2>
            <small>{this.state.loadMessage}</small>
          </div>
        </div>
      );
    } else {
      return (
        <div id="loading">
          <i className="fa fa-cog fa-spin fa-3x fa-fw" />
          Loading ...
        </div>
      );
    }
  }

  render() {
    return <div>{this.getContent()}</div>;
  }
}

export default connect(store => store)(keydown(App));
