import React from 'react'
import BandsPanel from './BandsPanel'
import CodeMirror from './CodeMirror'
import Store from '../../store'
import {connect} from 'react-redux'
import {getMultipliedLayers} from '../../utils/utils'
import _ from 'lodash'
import 'style!css!sass!./advanced.scss'

class AdvancedHolder extends React.Component {

    isScriptView() {
        return Store.current.currView === Store.current.views.SCRIPT
    }

    toggleMode = () => {
        Store.setCurrentView( this.isScriptView() ? Store.current.views.BANDS : Store.current.views.SCRIPT)
        let isEvalScriptFromLayers = (Store.current.evalscript === btoa("return [" + getMultipliedLayers(Store.current.layers) + "]") || Store.current.evalscript === '')
        if (isEvalScriptFromLayers) {
            Store.setEvalScript(this.isScriptView() ? btoa("return [" + getMultipliedLayers(Store.current.layers) + "]") : '')
            Store.refresh()
        }
    }

    render() {
        let isScript = this.isScriptView()
        return (<div className="advancedPanel" style={this.props.style}>
            <header>
                <a onClick={() => Store.setCurrentView(Store.current.views.PRESETS)} className="btn secondary"><i className="fa fa-arrow-left"></i>Back</a>
                <a className={"toggleBandMode" + (isScript ? " script" : "")} onClick={this.toggleMode}>
                    <i className="fa fa-hand-paper-o"></i>
                    <i className="fa fa-code script"></i>
                </a>
            </header>
            {(isScript) ? <CodeMirror /> : <BandsPanel />}
        </div>)
    }
}
export default connect(store => store)(AdvancedHolder);
