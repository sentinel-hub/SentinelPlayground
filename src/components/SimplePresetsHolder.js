import React from "react";
import { connect } from "react-redux";
import { map, isEmpty, isEqual } from "lodash";
import Store from "../store";
import AdvancedHolder from "./advanced/AdvancedHolder";
import WMSImage from "./WMSImage";

class SimplePresetsHolder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      base64Urls: {}
    };
  }
  activatePreset(preset) {
    if (Store.current.preset === preset && preset !== 'CUSTOM') return;
    Store.setPreset(preset);
    const { preset: sPreset, presets } = Store.current;
    if (!presets[sPreset].legendUrl) {
      Store.setLegendVisiblity(false); // legend not available
    }

    this.updateCurrentView();
  }

  componentDidMount() {
    this.getBase64Urls();
  }

  updateCurrentView() {
    Store.setCurrentView(
      Store.current.preset === "CUSTOM"
        ? Store.current.views.BANDS
        : Store.current.views.PRESETS
    );
  }

  getBase64Urls() {
    try {
      const base64Urls = localStorage.getItem("base64Urls");
      if (base64Urls === null) {
        return;
      }
      this.setState({ base64Urls: JSON.parse(base64Urls) });
    } catch (e) {
      //no local storage bsae64urls
    }
  }
  saveBase64(presetName, base64) {
    let ua = navigator.userAgent.toLowerCase();
    let isSafari = false;
    if (ua.indexOf("safari") != -1) {
      if (ua.indexOf("chrome") > -1) {
      } else {
        isSafari = true;
        return;
      }
    }
    //check if previous base64url is the same, then do nothing
    if (this.state.base64Urls[presetName] === base64) return;
    let obj = this.state.base64Urls;
    obj[presetName] = base64;
    this.setState({ base64Urls: obj });
    try {
      localStorage.setItem("base64Urls", JSON.stringify(this.state.base64Urls));
    } catch (e) {
      //writing unsuccessful
    }
  }

  handleLegendClick = (e, url) => {
    const legendVisible = Store.current.legendVisible;
    if (url) {
      Store.setLegendObj(url);
      Store.setLegendVisiblity(!legendVisible);
    }
  };

  getSimpleHolder() {
    const {
      legendObj,
      channels,
      legendVisible,
      presets,
      preset: storePreset
    } = Store.current;
    return (
      <div className="simplePresetsHolder">
        {map(presets, (preset, key) => {
          const presetHasLegend = preset.legendUrl,
                isActive = preset.legendUrl === legendObj && legendVisible,
                noChannels = channels.length === 0 && key === "CUSTOM";

          return (
            <a
              style={{
                display: noChannels ? "none" : "block",
                position: "relative",
                paddingRight: "50px"
              }}
              key={key}
              onClick={() => {
                this.activatePreset(key);
              }}
              className={storePreset === key ? "active" : ""}
            >
              {key === "CUSTOM"
                ? <i className="icon fa fa-paint-brush" />
                : <WMSImage
                    onBase64Gen={b => this.saveBase64(key, b)}
                    alt={preset.name}
                    src={
                      this.state.base64Urls[key] === undefined
                        ? preset.image
                        : this.state.base64Urls[key]
                    }
                    localStorageProp="test"
                  />}
              {preset.name}
              <small>{preset.desc}</small>

              {presetHasLegend &&
                <div className={`legendIcon ${isActive && "active"}`}>
                  <i
                    className="fa fa-list-ul"
                    title="Open a legend"
                    value={preset.legendUrl || ""}
                    onClick={e => this.handleLegendClick(e, preset.legendUrl)}
                  />
                </div>}
            </a>
          );
        })}
      </div>
    );
  }

  render() {
    let isBasic = Store.current.currView === Store.current.views.PRESETS;
    return (
      <div>
        <div style={{ display: isBasic ? "block" : "none" }}>
          {this.getSimpleHolder()}
        </div>
        {Store.current.channels.length > 0 &&
          <AdvancedHolder style={{ display: !isBasic ? "block" : "none" }} />}
      </div>
    );
  }
}
export default connect(store => store)(SimplePresetsHolder);
