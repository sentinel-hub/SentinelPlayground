import React from 'react'
import Toggle from 'react-toggle'
import Store from '../store'
import {connect} from 'react-redux'
import 'react-toggle/style.css'
import RCSlider from 'rc-slider'

class EffectsPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {gain: Store.current.gain}
    }

    updateColCor = (e) => {
        Store.setColorCorrection(e.target.checked ? 'SenCor' : '')
    }

    updateCloudCor = (e) => {
        Store.setCloudCorrection(e.target.checked ? 'replace' : 'none')
    }

    updateGain = (e) => {
        Store.setGain(e)
    }

    render() {
        return (
            <div className="effectsPanel">
                <label>
                    <Toggle
                        checked={Store.current.colCor !== ''}
                        onChange={this.updateColCor}/>
                    <span>Atmospheric correction</span>
                </label>
                <div />
                <label>
                    <Toggle
                        checked={Store.current.cloudCorrection !== 'none'}
                        onChange={this.updateCloudCor}/>
                    <span>Cloud correction</span>
                </label>
                <div />
                <label>
                    <span>Gain</span>
                    <div className="gainSlider">
                        <RCSlider min={0} max={3} step={0.1} value={this.state.gain} onChange={(e) => this.setState({gain: e})}
                              onAfterChange={this.updateGain}/>
                        <span>{this.state.gain}</span>
                    </div>
                </label>
            </div>
        )
    }
}
export default connect(store => store)(EffectsPanel);