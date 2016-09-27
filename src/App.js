import React, { Component } from 'react'
import Map from './components/Map'
import Tools from './components/Tools'
import DatePicker from './components/DatePicker'
import CloudSlider from './components/CloudSlider'
import SearchBox from './components/SearchBox'
import ImageWithLoading from './components/ImageWithLoading'
import {loadGetCapabilities} from "./utils/ajax"
import Rodal from 'rodal'
import 'rodal/lib/rodal.css'
import keydown from 'react-keydown'
import moment from 'moment'
import _ from 'lodash'
import Store from './store'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isLoaded: false,
      showImage: false,
      isDateVisible: false,
      toolsVisible: true
    }
  }

  render() {
    return (<div>
          {this.getContent()}
        </div>
    )
  }

  onResize = () => {
    Store.setSize([window.innerWidth,window.innerHeight])
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleNewHash(), false)
    loadGetCapabilities().then(() => {
      this.setState({isLoaded: true, isModal: false})
      this.handleNewHash()
      if (this.state.showImage) {
        this.doGenerate()
      }
    })
  }

  componentWillReceiveProps( { keydown } ) {
    if ( keydown.event ) {
      if (keydown.event.code === 'Escape') {
        this.setState({
          isModal: false,
          isSearchVisible: false,
          isDateVisible: false,
          isCloudVisible: false
        })
      }
    }
  }
  hideModal = () => {
    this.setState({isModal: false})
  }

  setMapLocation = (data) => {
    window.sgmap.panTo([data.location.lat, data.location.lng]);
  }

  doGenerate = () => {
    Store.generateWmsUrl()
    this.setState({isModal: true, showImage: false})
  }

  handleNewHash() {
    var path = window.location.hash.replace(/^#\/?|\/$/g, '');
    Store.current.path = path;
    if (path.indexOf('showImage') > -1) {
      this.setState({showImage: true})
    }
    let parsedObj = {}
    let params = path.split('/');
    _.forEach(params, (val) => {
      let param = val.split('=')
      let key = param[0]
      let value = param[1]
      if (key === 'time') {
        let t = value.replace(/\|/g, '/')
        parsedObj[key] = t;
        parsedObj['selectedDate'] = moment(t.split('/')[1])
      } else if (key=== 'layers') {
        if (parsedObj['preset'] === 'CUSTOM') {
          let l = value.split(',')
          parsedObj[key] = {r: l[0], g: l[1], b: l[2]}
        }
      } else {
        parsedObj[key] = value
      }
    })
    _.merge(Store.current, parsedObj)
  }

  getContent() {
    if (this.state.isLoaded) {
      return (<div>
        <Map ref="leaflet" />
        <SearchBox onLocationPicked={this.setMapLocation.bind(this)} />
        <a id="toggleSettings" onClick={() => this.setState({toolsVisible: !this.state.toolsVisible})}>
          <i className={'fa fa-' + (this.state.toolsVisible ? 'chevron-left' : 'cogs')}></i>
        </a>
        <Tools onResize={this.onResize} doGenerate={this.doGenerate} className={!this.state.toolsVisible && ('hidden')} />
        <DatePicker id="dateFloat" icon="calendar" onSelect={(e) => Store.setDate(moment(e))} isVisible={this.state.isDateVisible} />
        <CloudSlider />
        <Rodal animation="slideUp" visible={this.state.isModal} width={Store.current.size[0]-50} height={Store.current.size[1]-100} onClose={this.hideModal}>
          <ImageWithLoading imageUrl={Store.current.imgWmsUrl} />
          <div className="shareBar">
            <a className='btn' href={Store.current.imgWmsUrl} target="_blank"><i className="fa fa-download"></i>Download image</a>
          </div>
        </Rodal>
      </div>)
    } else {
      return (<div id="loading"><i className="fa fa-cog fa-spin fa-3x fa-fw"></i>Loading ... </div>)
    }
  }
}

export default keydown(App);
