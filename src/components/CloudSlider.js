import React from "react";
import RCSlider from "rc-slider";
import Store from '../store'
import {connect} from 'react-redux'
import onClickOutside from 'react-onclickoutside'
import 'rc-slider/assets/index.css'

const CloudSlider = React.createClass({
    getInitialState() {
        return {isVisible: false, maxcc: Store.current.maxcc}
    },

    togglePanel() {
        let state = this.state.isVisible
        this.setState({isVisible: !state})
    },

    handleClickOutside() {
        this.setState({isVisible: false});
    },
    onUpdate: function (e) {
        this.setState({maxcc: e});
    },
    updateMaxcc: function () {
        Store.setMaxcc(this.state.maxcc)
    },

    render() {
        return (<div className="floatItem" id="cloudFloat">
            <i className="fa fa-cloud" onClick={this.togglePanel}></i><span onClick={this.togglePanel}>{this.state.maxcc} %</span>
            {this.state.isVisible ? (<div className="cloudHolder">
                <RCSlider min={0} max={100} value={this.state.maxcc} onChange={this.onUpdate}
                          onAfterChange={this.updateMaxcc}/>
            </div>) : null
            }
        </div>)
    }
});

export default connect(store => store)(onClickOutside(CloudSlider))
