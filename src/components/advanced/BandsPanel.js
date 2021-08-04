import React from 'react';
import _ from 'lodash';
import Store from '../../store';
import { connect } from 'react-redux';
import dragula from 'react-dragula';
import { getMultipliedLayers } from '../../utils/utils';
import 'react-dragula/dist/dragula.min.css';
import './bands.scss';

class BandsPanel extends React.Component {
  componentDidMount() {
    var colorsHolder = this.refs.colorsHolder;
    var colTarR = this.refs.colTarR;
    var colTarG = this.refs.colTarG;
    var colTarB = this.refs.colTarB;

    let layers = Store.current.layers;
    dragula([colorsHolder, colTarR, colTarG, colTarB], {
      moves: function(el, target) {
        return target === colorsHolder;
      },
      accepts: function(el, target, source, sibling) {
        return target !== colorsHolder; // elements can be dropped in any of the `containers` by default
      },
      copy: true
    })
      .on('drop', (el, target, source, sibling) => {
        if ([colTarR, colTarG, colTarB].indexOf(source) > -1) {
          // if (source.childNodes.length > 0)
          source.childNodes[0].parentNode.removeChild(source.childNodes[0]);
          layers[source.dataset.colPrefix] = 'NULL';
        }
        if (target !== colorsHolder && target !== null) {
          layers[target.dataset.colPrefix] = el.dataset.name;
        }

        if (target !== null) {
          if (target.childNodes.length > 1) {
            for (let i = 0; i < target.childNodes.length; i++) {
              let child = target.childNodes[i];
              if (el !== child && child !== undefined) {
                child.parentNode.removeChild(child);
              }
            }
          }
        }

        document.getElementById('colorsWrap').classList.remove('ondrag');
        Store.setLayers(layers);
        Store.setEvalScript(btoa('return [' + getMultipliedLayers(Store.current.layers) + ']'));
      })
      .on('drag', (el, source) => {
        if (colorsHolder === source) {
          document.getElementById('colorsWrap').classList.add('ondrag');
        }
      });
    this.renderRGB();
  }
  componentDidUpdate(prevProps) {
    if (
      prevProps.activeDatasource &&
      this.props.activeDatasource &&
      prevProps.activeDatasource.id !== this.props.activeDatasource.id
    ) {
      Store.setEvalScript(btoa('return [' + getMultipliedLayers(Store.current.layers) + ']'));
      this.renderRGB();
    }
  }

  getChannel(value, key) {
    let obj = Store.current.channels.filter(function(obj) {
      return obj[key] === value;
    })[0];
    return obj;
  }
  renderRGB() {
    for (let i in Store.current.layers) {
      if (Store.current.layers.hasOwnProperty(i)) {
        let l = i.toUpperCase();
        let name = Store.current.layers[i];
        let channel = this.getChannel(name, 'name');
        document.getElementById('o' + l).innerHTML =
          name !== 'NULL'
            ? `<div style="background-color: ${channel.color}" title="${
                channel.desc
              }">${name.replace('B', '')}</div>`
            : '';
      }
    }
  }

  getWarning() {
    if (_.includes(Store.current.layers, 'NULL')) {
      return (
        <div id="warning" className="notification">
          <i className="fa fa-warning" />
          You need to fill all three channels to provide Sentinel imagery.
        </div>
      );
    }
  }

  render() {
    const { channels, layers } = Store.current;
    return (
      <div id="colorsWrap">
        <p style={{ fontSize: '12px', textAlign: 'center' }}>Drag bands onto output fields.</p>
        <div className="colorsContainer" ref="colorsHolder" id="colorsHolder">
          {channels.map((channel, i) => {
            return (
              <div
                key={i}
                title={channel.desc}
                style={{ backgroundColor: channel.color }}
                data-name={channel.name}
              >
                {channel.name.replace('B', '')}
              </div>
            );
          })}
        </div>
        <div id="colorsOutput" ref="colorsOutput">
          <b>R:</b>
          <div className="colHolder" data-col-prefix="r" ref="colTarR" id="oR" />
          <b>G:</b>
          <div className="colHolder" data-col-prefix="g" ref="colTarG" id="oG" />
          <b>B:</b>
          <div className="colHolder" data-col-prefix="b" ref="colTarB" id="oB" />
        </div>
        {this.getWarning()}
      </div>
    );
  }
}
export default connect(store => store)(BandsPanel);
