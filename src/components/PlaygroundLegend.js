import React, { PropTypes } from "react";
import { loadLegendJson } from "./../utils/ajax";
import axios from "axios";

import "style!css!sass!./PlaygroundLegend.scss";

export default class PlaygroundLegend extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.content = null;
    let link = this.props.link +
      `&format=application/json&timecachebusting=${new Date().valueOf()}`;

    axios
      .get(link)
      .then(response => {
        let data = response.data;
        let html = this.json2html(data);
        this.content = html;

        this.props.onLoad();
      })
      .catch(e => {
        this.props.onError();
      });
  }

  json2html(json) {
    let html = <span>json2html - error!</span>;

    try {
      if (json.type === "labels") {
        let _div = json.entries.map(entry => {
          // label
          let label = "";
          if (entry.value[0] === "") {
            label = `< ${entry.value[1]}`;
          } else if (entry.value[1] === "") {
            label = `> ${entry.value[0]}`;
          } else {
            label = `${entry.value[0]} .. ${entry.value[1]}`;
          }

          //color
          let color = entry.color[0];
          color = color.replace("#00", "#");

          return (
            <div key={label} className="PlaygroundLegend_Row">
              <div
                className="PlaygroundLegend_Color"
                style={{ backgroundColor: color }}
              />

              <div className="PlaygroundLegend_EntryLabel">
                {label}
              </div>

              <div className="PlaygroundLegend_Clear" />
            </div>
          );
        });

        return _div;
      } 

      return html;
    } catch (e) {
      console.error(e);
      return html;
    }

    return html;
  }

  render() {
    let content = this.content;
    let hasContent = content !== undefined || content !== null;

    return (
      <div>
        {hasContent ? content : ""}
      </div>
    );
  }
}

PlaygroundLegend.propTypes = {
  link: React.PropTypes.string,
  onLoad: React.PropTypes.func,
  onError: React.PropTypes.func
};
