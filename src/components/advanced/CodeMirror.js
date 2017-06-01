import React from 'react'
import Codemirror from 'react-codemirror';
import Store from '../../store'
import {connect} from 'react-redux'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'

class CodeMirror extends React.Component {

    updateCode = (newCode) => {
        Store.setEvalScript(btoa(newCode))
    }

    render() {
        var options = {
            lineNumbers: true,
            mode: "javascript",
            lint: true
        }
        return <div style={{clear: 'both'}}>
            <Codemirror value={atob(Store.current.evalscript.replace(/\==/g, ''))} onChange={this.updateCode} options={options} />
            <div className="scriptBtnPanel">
              <button onClick={Store.refresh} className="btn"><i className="fa fa-refresh"></i>Refresh</button>
            </div>
        </div>
    }
}
export default connect(store => store)(CodeMirror)