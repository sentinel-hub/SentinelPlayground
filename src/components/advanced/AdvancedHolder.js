import React from 'react';
import BandsPanel from './BandsPanel';
import CodeMirror from './CodeMirror';
import Store from '../../store';
import { connect } from 'react-redux';
import { getMultipliedLayers } from '../../utils/utils';
import './advanced.scss';

class AdvancedHolder extends React.Component {
  isScriptView() {
    return Store.current.currView === Store.current.views.SCRIPT; // || (Store.current.evalscript !== '') //&& Store.current.currView === Store.current.views.PRESETS)
  }

  toggleMode = () => {
    Store.setCurrentView(
      this.isScriptView() ? Store.current.views.BANDS : Store.current.views.SCRIPT
    );
    if (Store.current.evalscript === '') {
      Store.setEvalScript(btoa('return [' + getMultipliedLayers(Store.current.layers) + ']'));
    }
  };

  render() {
    let isScript = this.isScriptView();
    return (
      <div className="advancedPanel" style={this.props.style}>
        <header>
          <a className={'toggleBandMode' + (isScript ? ' script' : '')} onClick={this.toggleMode}>
            <i className="fa fa-hand-paper-o" />
            <i className="fa fa-code script" />
          </a>
        </header>
        {isScript ? <CodeMirror /> : <BandsPanel />}
      </div>
    );
  }
}
export default connect(store => store)(AdvancedHolder);
