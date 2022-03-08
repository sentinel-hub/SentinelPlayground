import React from 'react';
// import Codemirror from 'react-codemirror'
import Store from '../../store';
import { connect } from 'react-redux';
// import 'codemirror/mode/javascript/javascript'
// import 'codemirror/lib/codemirror.css'
// import 'codemirror/addon/lint/lint.js'
// import 'codemirror/addon/lint/javascript-lint.js'
// import 'codemirror/addon/lint/json-lint.js'
// import 'codemirror/addon/lint/lint.css'
// import 'codemirror/theme/dracula.css'
import ScriptPanel from './ScriptPanel';
import { b64EncodeUnicode } from '../../utils/utils';
import axios from 'axios';

class CodeMirror extends React.Component {
  state = {
    error: null,
    loading: false
  };

  updateCode = newCode => {
    Store.setEvalScript(window.btoa(newCode));
  };

  selectEvalMode = mode => {
    Store.setEvalMode(mode);
  };

  loadCode = () => {
    if (this.state.loading) return;
    this.setState({ loading: true });
    const url = window.decodeURIComponent(Store.current.evalscripturl);
    if (url.includes('http://')) {
      return;
    }
    axios
      .get(url)
      .then(res => {
        Store.setEvalScript(window.btoa(res.data));
        this._CM.cm.codeMirror.setValue(res.data);
        this.setState({ loading: false, success: true }, () => {
          setTimeout(() => this.setState({ success: false }), 2000);
        });
      })
      .catch(e => {
        console.error(e);
        this.setState({ loading: false });
        this.setState({ error: 'Error loading script. Check your URL.' }, () => {
          setTimeout(() => this.setState({ error: null }), 3000);
        });
      });
  };

  render() {
    const { error, loading, success } = this.state;
    const { evalscript, evalscripturl, isEvalUrl } = Store.current;
    const cleanUrl = window.decodeURIComponent(evalscripturl);
    const hasWarning = evalscripturl.includes('http://');
    return (
      <div style={{ clear: 'both' }}>
        <ScriptPanel
          ref={el => (this._CM = el)}
          resizable
          value={atob(evalscript)}
          onChange={this.updateCode}
        />
        {error && (
          <div className="notification">
            <i className="fa fa-warning" /> {error}
          </div>
        )}
        <div style={{ padding: 5, fontSize: 12 }}>
          <div title="Insert URL to your custom script">
            Script URL [?]:
            <span style={{ float: 'right', marginTop: '-3px' }}>
              <input
                type="checkbox"
                id="evalscriptUrlCB"
                onClick={e => this.selectEvalMode(e.target.checked)}
                checked={isEvalUrl}
              />
              <label htmlFor="evalscriptUrlCB" style={{ marginTop: '-3px' }}>
                Use URL
              </label>
            </span>
          </div>{' '}
          <input
            style={{ width: 'calc(100% - 40px)' }}
            value={cleanUrl}
            disabled={!isEvalUrl}
            onChange={e => Store.setEvalUrl(window.encodeURIComponent(e.target.value))}
          />
          {success || hasWarning ? (
            <i
              title={success ? 'Script loaded.' : 'Only HTTPS domains are allowed.'}
              className={`fa fa-${success ? 'check' : 'warning'}`}
              style={{ marginLeft: 7 }}
            />
          ) : (
            <span style={{ color: '#c9ced4' }} onClick={this.loadCode}>
              <i className={`fa fa-refresh ${loading && 'fa-spin'}`} style={{ marginLeft: 7 }} />
            </span>
          )}
        </div>
        <div className="scriptBtnPanel">
          <button onClick={Store.refresh} className="btn">
            <i className="fa fa-refresh" />
            Refresh
          </button>
        </div>
      </div>
    );
  }
}
export default connect(store => store)(CodeMirror);
