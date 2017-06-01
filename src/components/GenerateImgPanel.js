import React, { Component, PropTypes } from "react";
import ClipboardButton from "react-clipboard.js";
import ImageWithLoading from "./ImageWithLoading";
import request from "axios";
import moment from 'moment'

import 'style!css!sass!./GenerateImgPanel.scss';

class GenerateImagePanel extends Component {
  state = {
    effectsVisible: false,
    effect: 0,
    showInfo: false,
    hasError: false,
  };


  render() {
    const { imgUrl, onCopy } = this.props;
    let showImageLink = `${window.location.href}&showImage`

    let href = window.location.href

    return (
      <div>
        <ImageWithLoading imageUrl={imgUrl} ref={e => this.image = e} />
        <div className="shareBar">
          <ClipboardButton
            className="btn"
            onSuccess={onCopy}
            data-clipboard-text={showImageLink}
          >
            <i className="fa fa-clipboard" />Copy URL
          </ClipboardButton>
          <a className="btn" href={imgUrl} download>
            <i className="fa fa-download" />Download image
          </a>
        </div>
      </div>
    );
  }
}

GenerateImagePanel.propTypes = {
  imgUrl: React.PropTypes.string,
  onCopy: React.PropTypes.func,
  onSetEffect: React.PropTypes.func
};

export default GenerateImagePanel;
