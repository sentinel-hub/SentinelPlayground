import React from 'react'
import SimplePresetsHolder from './SimplePresetsHolder'
import EffectsPanel from './EffectsPanel'
import Tabs from 'react-simpletabs'
import 'style!css!sass!./Tools.scss';
import Store from '../store'
import logo from '../logo.png'
import {connect} from 'react-redux'

let tabPanel, menuPanel

class Tools extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabHeight: window.innerHeight
    };
  }

  handleResize = () => {
    this.setState({
      tabHeight: window.innerHeight - (menuPanel.offsetHeight + 45 + this.refs.footer.offsetHeight + 30),
    });
    this.props.onResize()
  }

  componentDidUpdate() {
    if (tabPanel) {
      tabPanel.style.maxHeight = this.state.tabHeight + "px"
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  generateFooter() {
    let zoom = Store.current.zoom
    let min = Store.current.activeBaseLayer.minmax.min
    let max = Store.current.activeBaseLayer.minmax.max
    if (zoom < min) {
      return <div className="notification"><i className="fa fa-warning"></i> Zoom in to view {Store.current.activeBaseLayer.name}</div>
    } else if (zoom > max) {
      return <div className="notification"><i className="fa fa-warning"></i> Zoom out to view {Store.current.activeBaseLayer.name}</div>
    } else {
      return <button onClick={this.props.doGenerate} className="btn"><i className="fa fa-print"></i>Generate</button>
    }
  }

  onMount = (e, panel, menu) => {
    tabPanel = panel
    menuPanel = menu
  }

  render() {
    return <div id="tools" className={this.props.className}>
      <header ref="header">
        <img src={logo} alt="Sentinel Playground" />
      </header>
      <Tabs onMount={this.onMount} style={{height: this.state.tabHeight}}>
        <Tabs.Panel key={1} title={[<i className='fa fa-paint-brush'></i>, "Rendering"]}>
          <SimplePresetsHolder key={1} />
        </Tabs.Panel>
        <Tabs.Panel key={2} title={[<i className='fa fa-sliders'></i>, "Effects"]}>
          <EffectsPanel key={1}/>
        </Tabs.Panel>
      </Tabs>
      <footer ref="footer">
        {this.generateFooter()}
      </footer>
    </div>
    this.handleResize()
  }
}

Tools.propTypes = {
  onResize: React.PropTypes.func,
  doGenerate: React.PropTypes.func
};

export default connect(store => store)(Tools)