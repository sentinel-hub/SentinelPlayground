import React, { Component } from "react";
import Map from "./components/Map";
import Tools from "./components/Tools";
import DatePicker from "./components/DatePicker";
import CloudSlider from "./components/CloudSlider";
import SearchBox from "./components/SearchBox";
import DummyIcon from './components/DummyIcon';
import PlaygroundLegend from './components/PlaygroundLegend';
import GenerateImgPanel from "./components/GenerateImgPanel";
import Geosuggest from "react-geosuggest";
import { loadGetCapabilities, queryAvailableDates, getPrevNextByPoint } from "./utils/ajax";
import {queryDates} from './utils/queryDates';
import { getPolyfill } from "./utils/utils";
import Rodal from "rodal";
import "rodal/lib/rodal.css";
import keydown from "react-keydown";
import moment from "moment";
import _ from "lodash";
import { connect } from "react-redux";
import Store from "./store";
import Draggable from 'react-draggable';
import 'style!css!sass!./App.scss';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      showImage: false,
      isDateVisible: false,
      toolsVisible: true,
      isCopied: false,
      legendDataLoaded: false,
      legendDataError:false
    };
    this.dateRanges = {
      "S2": {
        min: "2015-01-01"
      },
      "S3": {
        min: "2016-02-01"
      },
      "ENV": {
        min: "2002-01-01",
        max: "2012-05-01",
      },
      "L5": {
        min: "1984-01-01",
        max: "2013-05-01",
      },
      "L7": {
        min: "1999-01-01",
        max: "2003-12-01",
      },
      "L8": {
        min: "2013-01-01",
      },
    }
    getPolyfill()
  }

  render() {
    return (
      <div>
        {this.getContent()}
      </div>
    );
  }

  onResize = () => {
    Store.setSize([window.innerWidth, window.innerHeight]);
  };

  componentDidMount() {
    window.addEventListener("hashchange", this.handleNewHash(), false); // onhashchange doesn't detect url query params change :D


    loadGetCapabilities()
      .then(() => {
        this.setState({ isLoaded: true, isModal: false, isLegendModal: false });
        this.handleNewHash();
        if (this.state.showImage) {
          this.doGenerate();
        }
      })
      .catch(e => {
        console.error(e)
        this.setState({
          loadError: true,
          loadMessage: JSON.stringify(e)
        });
      });
    
  }

  componentWillReceiveProps({ keydown }) {

    if (keydown.event) {
      if (keydown.event.code === "Escape") {
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
      this.setState({legendDataLoaded: false, legendDataError: false})
    }
    
  }
  

  hideModal = () => {
    this.setState({ isModal: false });
  };
  hideLegendModal = () => {
    this.setState({ isLegendModal: false });
  };
  toggleLegendModal = (e) => {
    this.setState({ isLegendModal: !this.state.isLegendModal });
  }

  setMapLocation = data => {
    Store.setLat(data.location.lat)
    Store.setLng(data.location.lng)
    this.map.refs.wrappedInstance.updatePosition();
  };

  doGenerate = () => {
    Store.generateWmsUrl();
    this.setState({ isModal: true, showImage: false });
  };

  handleNewHash = () => {
    const hasSearch = window.location.href.indexOf("?") > -1
    var path = hasSearch ? window.location.search : window.location.hash.replace(/^#\/?|\/$/g, "");
    if (hasSearch) {
      path = path.replace("?","")
    }
    path = path.replace("%7C", "/")
    let isPlusSign = false;
    if (path.indexOf("+") > -1 || path.indexOf("%2B") > -1) {
      path = path.replace(/\+/g, "%2B");
      isPlusSign = true;
    }
    if (path.indexOf("/showImage") > -1) {
      path = path.replace('/showImage', '&showImage=true')
    }
    Store.current.path = path;
    if (path.indexOf("showImage") > -1) {
      this.setState({ showImage: true });
    }

    let parsedObj = {};
    const hasAndSeparator = path.includes("&")
    // falback for previous separations
    let params = path.split(hasAndSeparator ? '&' : '/')
    
    _.forEach(params, val => {
      let param = val.split("=");
      let key = param[0];
      let value = param[1];
      if (key === "time") {
        let t = value.replace(/\|/g, "/");
        parsedObj[key] = t;
        parsedObj["selectedDate"] = moment(t.split("/")[1]);
      } else if (key === "layers") {
        if (parsedObj["preset"] === "CUSTOM") {
          let l = value.split(",");
          parsedObj[key] = { r: l[0], g: l[1], b: l[2] };
          parsedObj["currView"] = Store.current.views.BANDS;
        }
      } else if (key === 'x') {
        parsedObj['lng'] = value
      } else if (key === 'layermap') {
        const obj = {}, sources = []
        value.split(";").forEach(pair => {
          let [layer, source] = pair.split(",");
          if (!source || source === "") source = "S2";
          obj[layer] = source;
          const datasource = this.dateRanges[source]
          parsedObj["minDate"] = datasource.min
          parsedObj["maxDate"] = datasource.max ? datasource.max : moment()
          parsedObj['source'] = source
        })
        parsedObj[key] = obj
      } else if (key === 'source') {
        const datasource = this.dateRanges[value]
        parsedObj["minDate"] = datasource.min
        parsedObj["maxDate"] = datasource.max ? datasource.max : moment()
        parsedObj['source'] = value
        if (path.indexOf("time") === -1) {
          parsedObj['selectedDate'] = moment(parsedObj.maxDate)
        }
      } else if (key === 'atmFilter') {
        parsedObj['atmFilter'] = value
      } else if (key === 'showDates') {
        parsedObj['showDates'] = value === 'true'
      } else if (key === 'CLOUDCORRECTION') {
        parsedObj['cloudCorrection'] = value
      } else if (key === 'y') {
        parsedObj['lat'] = value
      } else if (key === 'evalscript' && value !== '') {
        let evalScript = value
        let valid = true

        if(evalScript === '/showImage') {
            valid = false
        }      
  
        try {
          atob(evalScript)
          
        } catch(e){
          valid = false
        }

        if(valid) {
          parsedObj[key] = evalScript + '=='
          parsedObj['currView'] = Store.current.views.SCRIPT
          parsedObj['showDates'] = false
        }
        
      } else {
        parsedObj[key] = value;
      }

      if (parsedObj["instanceID"] !== undefined) {
        Store.current["customParams"] = true;
      }
    });

    if((parsedObj['lat'] === '0' || parsedObj['lat'] === 0) && 
       (parsedObj['lng'] === '0' || parsedObj['lng'] === 0) &&
       (parsedObj['zoom'] === '1' || parsedObj['zoom'] === 1)) {

        parsedObj['lat'] = 40.4
        parsedObj['lng'] = -3.73
        parsedObj['zoom'] = 12
    }

    queryDates(undefined, false, false)

    _.merge(Store.current, parsedObj);
  }

  onCopy = () => {
    this.setState({isCopied:true}) 
    setTimeout(() => { 
      this.setState({isCopied:false}) 
    }, 3000) 
  };

  queryDates(dateFrom, dateTo, justQuery = false) {
    queryDates(undefined, false, false)
  }

  handleModalSuccess = () => {
    this.setState({legendDataLoaded: true, legendDataError: false})
  }

  handleModalError = () => {
    this.setState({legendDataLoaded: true, legendDataError: true})
  }

  getContent() {
    if (this.state.isLoaded) {
      let preset = Store.current.preset
      let presetLegend = _.find(Store.current.presetsLegend, value => preset == value.name)

      return (
        <div>
          <Map ref={e => this.map = e} />
          <div id="Controls" className={!this.state.toolsVisible && "hidden"}>
            <div id="ControlsContent">
              <div className="pull-right half-size">
                <DummyIcon />
                <div className="clear-both-700"></div>
                <SearchBox onLocationPicked={this.setMapLocation.bind(this)} toolsVisible={this.state.toolsVisible} />
                
                <div className="dev-tools-clear-1050"></div>
              </div>
              <div className="clear-both-700"></div>
              <div className="pull-left half-size pull-right-700">
                <DatePicker
                  id="dateFloat"
                  icon="calendar"
                  onNavClick={this.queryDates}
                  onSelect={e => Store.setDate(moment(e))}
                  isVisible={this.state.isDateVisible}
                  onExpand={() => this.queryDates(true)}
                />
                <div className="clear-both-700"></div>
                <CloudSlider onExpand={() => this.queryDates(true)} />
                <div className="clear-both-700"></div>
              </div>
            </div>
          </div>

          <a
            id="toggleSettings"
            className={!this.state.toolsVisible && "hidden"}
            onClick={() =>
              this.setState({ toolsVisible: !this.state.toolsVisible })}
          >
            <i
              className={
                "fa fa-" + (this.state.toolsVisible ? "chevron-left" : "cogs")
              }
            />
          </a>
          <Tools
            onResize={this.onResize}
            doGenerate={this.doGenerate}
            className={!this.state.toolsVisible && "hidden"}
            toggleLegendModal={this.toggleLegendModal}
          />
          <Rodal
            animation="slideUp"
            visible={this.state.isModal}
            width={Store.current.size[0] - 80}
            height={Store.current.size[1] - 100}
            onClose={this.hideModal}
          >
            {this.state.isModal &&
              <GenerateImgPanel
                imgUrl={Store.current.imgWmsUrl}
                onCopy={this.onCopy}
              />}
          </Rodal>
          
          <Draggable
            handle=".handle"
            defaultPosition={{x: window.innerWidth - 173, y: 77}}
            bounds='#root'
            position={null}>
                <div className="handle legendModal"
                     style={{'display': Store.current.legendVisible ? 'inline-block': 'none'}}
                >
                    {!this.state.legendDataLoaded && (
                      <div>
                        <i className="fa fa-spinner fa-pulse"></i>
                        <span>&nbsp;Loading...</span>
                      </div>
                    )}
                    
                    {this.state.legendDataLoaded && (<p>
                        {Store.current.presets && Store.current.presets[Store.current.preset].name} 
                        <i className="fa fa-close" onClick={() => Store.setLegendVisiblity(false)}></i>
                      </p>)}

                    
                    {Store.current.legendVisible && (
                      <PlaygroundLegend link={Store.current.legendObj}
                        onLoad={this.handleModalSuccess}
                        onError={this.handleModalError} 
                      />
                    )}
                      

                    {this.state.legendDataError && (
                      <p>There was an error<br />while downloading data<br />for the legend.</p>
                    )}

                </div>
          </Draggable>
          <div className={`copyNotification ${this.state.isCopied && 'visible'}`}>
              <i className="fa fa-check-circle"></i> 
              Url successfully copied to clipboard!</div> 
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
          <i className="fa fa-cog fa-spin fa-3x fa-fw" />Loading ...
        </div>
      );
    }
  }
}

export default connect(store => store)(keydown(App));
