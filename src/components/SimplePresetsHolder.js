import React from 'react';
import { connect } from 'react-redux';
import Store from '../store';
import AdvancedHolder from './advanced/AdvancedHolder';
import WMSImage from './WMSImage';

const customPreset = {
  name: 'Custom',
  id: 'CUSTOM',
  desc: 'Create custom rendering'
};

class SimplePresetsHolder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      base64Urls: {}
    };
  }
  activatePreset(preset) {
    const { id, legendUrl } = preset;
    if (Store.current.preset === id && id !== 'CUSTOM') return;
    Store.setPreset(id);
    if (!legendUrl) {
      Store.setLegendVisiblity(false); // legend not available
    }

    this.updateCurrentView();
  }

  componentDidMount() {
    this.getBase64Urls();
  }

  updateCurrentView() {
    Store.setCurrentView(
      Store.current.preset === 'CUSTOM' ? Store.current.views.BANDS : Store.current.views.PRESETS
    );
  }

  getBase64Urls() {
    try {
      const base64Urls = localStorage.getItem('base64Urls');
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
    if (ua.indexOf('safari') != -1) {
      if (ua.indexOf('chrome') > -1) {
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
      localStorage.setItem('base64Urls', JSON.stringify(this.state.base64Urls));
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
    const { legendObj, channels, legendVisible, presets, preset: storePreset } = Store.current;
    const sortedPresets = presets.sort((a, b) => a.id.localeCompare(b.id));
    const actualPresets = channels.length > 0 ? [customPreset, ...sortedPresets] : sortedPresets;
    return (
      <div className="simplePresetsHolder">
        {actualPresets.map((preset, i) => {
          const { name, description, image, legendUrl, id } = preset;
          const isActive = legendUrl === legendObj && legendVisible,
            isCustom = id === 'CUSTOM',
            hasChannels = channels.length > 0 && isCustom,
            draw = !isCustom || (isCustom && hasChannels);

          return (
            draw && (
              <a
                style={{
                  position: 'relative',
                  paddingRight: '50px'
                }}
                key={id}
                onClick={() => {
                  this.activatePreset(preset);
                }}
                className={storePreset === id ? 'active' : ''}
              >
                {isCustom ? (
                  <i className="icon fa fa-paint-brush" />
                ) : (
                  <WMSImage
                    // onBase64Gen={b => this.saveBase64(key, b)}
                    alt={name}
                    src={image}
                    localStorageProp="test"
                  />
                )}
                {name}
                <small>{description}</small>
                {legendUrl && (
                  <div className={`legendIcon ${isActive && 'active'}`}>
                    <i
                      className="fa fa-list-ul"
                      title="Open a legend"
                      value={legendUrl || ''}
                      onClick={e => this.handleLegendClick(e, preset.legendUrl)}
                    />
                  </div>
                )}
              </a>
            )
          );
        })}
      </div>
    );
  }

  render() {
    let isBasic = Store.current.currView === Store.current.views.PRESETS;
    return (
      <div>
        <div style={{ display: isBasic ? 'block' : 'none' }}>{this.getSimpleHolder()}</div>
        {Store.current.channels.length > 0 && (
          <AdvancedHolder style={{ display: !isBasic ? 'block' : 'none' }} />
        )}
      </div>
    );
  }
}
export default connect(store => store)(SimplePresetsHolder);
