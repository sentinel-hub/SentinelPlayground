import React, { Component } from 'react';
import Codemirror from 'react-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/javascript-lint.js';
import 'codemirror/addon/lint/json-lint.js';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/theme/dracula.css';
import styled, { injectGlobal, css } from 'styled-components';

injectGlobal`
.CodeMirror-lint-tooltip {
  z-index: 100000;
}
`;
const Style = styled.div`
  height: ${({ height }) => height || '250px'};

  ${({ resizable }) =>
    resizable &&
    css`
      resize: both;
      overflow: auto;
      padding-bottom: 10px;
    `} .ReactCodeMirror {
    display: block;
    width: auto;
    height: 100%;
    vertical-align: top;

    .CodeMirror {
      height: 100%;
    }
  }
`;
export default class ScriptPanel extends Component {
  state = {
    value: this.props.value,
    isValid: window.JSHINT ? window.JSHINT(this.props.value || '') : true,
    options: {
      lineNumbers: true,
      fixedGutter: true,
      readOnly: this.props.disabled,
      mode: this.props.mode || 'javascript',
      lint: {
        esversion: 6
      }
    }
  };

  updateCode = value => {
    const isValid = window.JSHINT ? window.JSHINT(value) : true;
    this.setState({ value, isValid }, this.props.onChange && this.props.onChange(value, isValid));
  };

  render() {
    const { value, options } = this.state;
    const { height, resizable, disabled } = this.props;

    return (
      <Style {...{ resizable, height }}>
        <Codemirror
          disabled={disabled}
          ref={el => (this.cm = el)}
          value={this.props.value}
          onChange={this.updateCode}
          options={options}
        />
      </Style>
    );
  }
}
