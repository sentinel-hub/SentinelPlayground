import React, { Component } from 'react';
import ClipboardButton from 'react-clipboard.js';
import { legacyGetMapFromParams } from '@sentinel-hub/sentinelhub-js';
import ImageWithLoading from './ImageWithLoading';

import './GenerateImgPanel.scss';

class GenerateImagePanel extends Component {
  state = {
    imgUrl: null
  };

  async componentDidMount() {
    const { baseUrl, wmsParams } = this.props;
    const imgBlob = await legacyGetMapFromParams(baseUrl, wmsParams);
    const imgUrl = window.URL.createObjectURL(imgBlob);
    this.setState({ imgUrl });
  }

  render() {
    const { wmsParams, onCopy } = this.props;
    const { imgUrl } = this.state;

    let showImageLink = `${window.location.href}&showImage`;

    return (
      <div>
        <ImageWithLoading imageUrl={imgUrl} ref={e => (this.image = e)} />
        <div className="shareBar">
          <ClipboardButton className="btn" onSuccess={onCopy} data-clipboard-text={showImageLink}>
            <i className="fa fa-clipboard" />
            Copy URL
          </ClipboardButton>
          <a className="btn" href={imgUrl} download={wmsParams.nicename}>
            <i className="fa fa-download" />
            Download image
          </a>
        </div>
      </div>
    );
  }
}

export default GenerateImagePanel;
