import React from 'react'
import SimplePresetsHolder from './SimplePresetsHolder'
import EffectsPanel from './EffectsPanel'
import Tabs from 'react-simpletabs'
import './Tools.scss'
import Store from '../store'
import logo from '../logo.png'
import { connect } from 'react-redux'

let tabPanel, menuPanel

class Tools extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tabHeight: window.innerHeight
    }
  }

  handleResize = () => {
    let viewportWidth = window.innerWidth
    let bottomMargin = 37
    if (viewportWidth < 701) {
      bottomMargin = 46
    }

    this.setState({
      tabHeight: window.innerHeight - (menuPanel.offsetHeight + 60 + this.refs.footer.offsetHeight)
    })
    this.props.onResize()
  }

  componentDidUpdate() {
    if (tabPanel) {
      tabPanel.style.maxHeight = this.state.tabHeight + 'px'
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
    let { activeDatasource: { min, max, name }, zoom, currView } = Store.current
    if (zoom < min || zoom > max) {
      return (
        <div className="notification">
          <i className="fa fa-warning" /> Zoom {zoom > max ? 'out' : 'in'} to view {name}
        </div>
      )
    } else {
      return (
        <div>
          {currView !== Store.current.views.PRESETS && (
            <a onClick={() => Store.setCurrentView(Store.current.views.PRESETS)} className="btn secondary">
              <i className="fa fa-arrow-left" />Back to list
            </a>
          )}
          <button onClick={this.props.doGenerate} className="btn">
            <i className="fa fa-print" />Generate
          </button>
        </div>
      )
    }
  }

  onMount = (e, panel, menu) => {
    tabPanel = panel
    menuPanel = menu
  }

  render() {
    return (
      <div id="tools" className={this.props.className}>
        <header ref="header">
          <img src={logo} alt="Sentinel Playground" />
        </header>
        <Tabs onMount={this.onMount} style={{ height: this.state.tabHeight }}>
          <Tabs.Panel key={1} title={[<i className="fa fa-paint-brush" />, 'Rendering']}>
            <SimplePresetsHolder key={1} toggleLegendModal={this.props.toggleLegendModal} />
          </Tabs.Panel>
          <Tabs.Panel key={2} title={[<i className="fa fa-sliders" />, 'Effects']}>
            <EffectsPanel key={1} />
          </Tabs.Panel>
        </Tabs>
        <footer ref="footer">{this.generateFooter()}</footer>
      </div>
    )
  }
}

Tools.propTypes = {
  onResize: React.PropTypes.func,
  doGenerate: React.PropTypes.func
}

export default connect(store => store)(Tools)
