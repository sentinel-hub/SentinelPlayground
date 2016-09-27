import React from 'react'
import {connect} from 'react-redux'
import {map, isEmpty, isEqual} from 'lodash'
import Store from '../store'
import AdvancedHolder from './advanced/AdvancedHolder'
import WMSImage from './WMSImage'

class SimplePresetsHolder extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      base64Urls: {}
    }
  }
  activatePreset(preset) {
    Store.setPreset(preset)
    this.updateCurrentView()
  }

  componentDidMount() {
    this.getBase64Urls()
    this.updateCurrentView()
  }

  updateCurrentView() {
    Store.setCurrentView((Store.current.preset === 'CUSTOM') ? Store.current.views.BANDS : Store.current.views.PRESETS)
  }

  getBase64Urls() {
    try {
      const base64Urls = localStorage.getItem('base64Urls')
      if (base64Urls === null) {
        return
      }
      this.setState({base64Urls: JSON.parse(base64Urls)})
    } catch (e) {
      //no local storage bsae64urls
    }
  }
  saveBase64(presetName, base64) {
    //check if previous base64url is the same, then do nothing
    if (this.state.base64Urls[presetName] === base64) return
    let obj = this.state.base64Urls
    obj[presetName] = base64
    this.setState({base64Urls: obj})
    try {
      localStorage.setItem('base64Urls', JSON.stringify(this.state.base64Urls))
    } catch (e) {
      //writing unsuccessful
    }
  }
  getSimpleHolder() {
    return (<div className="simplePresetsHolder">
      {
        map(Store.current.presets, (preset, key) => {
          return <a key={key} onClick={() => { this.activatePreset(key) }} className={(Store.current.preset === key) ? "active" : ""}>
              {key === "CUSTOM" ? <i className='icon fa fa-paint-brush'></i> :
              <WMSImage onBase64Gen={(b) => this.saveBase64(key, b)} alt={preset.name} src={(this.state.base64Urls[key] === undefined) ? preset.image : this.state.base64Urls[key]} localStorageProp='test'/>}
            {preset.name}
            <small>{preset.desc}</small>
          </a>
        })
      }
    </div>)
  }

  render() {
    return (<div>{(Store.current.currView === Store.current.views.PRESETS) ? this.getSimpleHolder() : (
      <AdvancedHolder />)}</div>)
  }
}
export default connect(store => store)(SimplePresetsHolder)
