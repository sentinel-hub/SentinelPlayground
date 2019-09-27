import React, { Component } from 'react';
import ClipboardButton from 'react-clipboard.js';
import ImageWithLoading from './ImageWithLoading';
import request from 'axios';
import deepart from './deepart.png';
import moment from 'moment';
import { shortenUrl } from './../utils/ajax';
import Store from '../store';

import './GenerateImgPanel.scss';

class GenerateImagePanel extends Component {
  state = {
    effectsVisible: false,
    effect: 0,
    showInfo: false,
    hasError: false,
    downloadUrl: '',
    deepartStyles: {
      1: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/1c/cd/1ccdc6af702f1edb499e6a98d41227bb.jpg',
      8: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/2a/62/2a620650887b37217bc92adc11c665fb.jpg',
      9: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/4a/e6/4ae6a8c76edb0881a6021a2e4e73782f.jpg',
      10: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/83/4d/834d8765b4699b57950721a2394a9d23.jpg',
      11: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/1f/2b/1f2b52d385e77b1fec4b0a076a0e8bc6.jpg',
      12: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/a4/34/a43405dd287d4d885a7ac408420cf701.jpg',
      14: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/90/b1/90b18ad706ab13bb26b4de9a5095823a.jpg',
      15: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/36/8a/368aaea94ffe543764c73752747a110f.jpg',
      16: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/d8/40/d84052774664cd7daf1890740008496d.jpg',
      17: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/b5/5b/b55bf904fb77cb7939e53c495ab251d6.jpg',
      18: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/89/28/89283b9cfdb8250902d9ed922c0cfaa0.jpg',
      6: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/00/e0/00e00c30ec00053878276583bf8b4f57.jpg',
      19: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/73/bc/73bc91f21c5a0e4e14997c47d3f682f1.jpg',
      20: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/d3/7f/d37f8f68601aaae88a59e6105c9cf525.jpg',
      21: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/7b/b6/7bb607dcfa6057afae2dfae7ef4cd14e.jpg',
      22: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/f7/25/f7252f07e5086fc184d5f2f61e65d5ec.jpg',
      23: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/9e/de/9ede61694f03b948599292b8a64c733e.jpg',
      24: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/a0/3d/a03d0ac6259779d1c7cd07a0e734524f.jpg',
      25: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/32/fa/32fa9cba9ceb0fa5401e140a7659e485.jpg',
      26: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/7a/41/7a4131445e0caccdd70dbba52408d76f.jpg',
      27: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/e2/4e/e24e8b1d3efd85f435dbce80029072ae.jpg',
      28: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/53/e5/53e5fc03e8ca7fade3f05c08dab6ad4f.jpg',
      29: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/42/bc/42bc90e4eb253984e37f8d204d2384a1.jpg',
      30: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/23/ef/23efdaf7488de29509a1456d8cd484cb.jpg',
      31: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/f0/5d/f05dbbe2a62ac29a35f6c74eecf96de2.jpg',
      32: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/ff/0c/ff0cbf402452af09227840702387743e.jpg',
      33: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/82/e3/82e396288fd8f7ed76df527200921c3f.jpg',
      34: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/dc/52/dc52c37be456d2dd81431a9b159ea61a.jpg',
      35: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/91/2d/912dd9758b9173cfd80b3f84f932697d.jpg',
      36: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/ce/72/ce72b1c85cc6887085c5cd49ebd8b838.jpg',
      37: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/49/64/4964e7b56aa77a7439eae60133cb5fff.jpg',
      38: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/17/03/170309a16c6376d565e3567c185caeeb.jpg',
      39: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/e8/72/e8721a3a254b7140ed1ddbbcadd786d2.jpg',
      40: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/70/9c/709c715cfd25c42776e008043d753d20.jpg',
      41: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/4b/0a/4b0a048cd06187b7a069224ce6679bcd.jpg',
      42: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/1e/b2/1eb2d099243c95f21b3a48776ef8fab9.jpg',
      43: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/03/01/0301de8b501ae8205fa8026ba29bc2b1.jpg',
      45: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/0d/1b/0d1bcd45e8fd1ff20bf2242c3bc10cd7.jpg',
      47: 'https://s3-eu-west-1.amazonaws.com/turbo.deepart.io/cache/0a/62/0a62db2354363be5b441a4ba41115988.jpg'
    },
    twitterShare: null,
    linkedInShare: null
  };

  setEffect = style => {
    this.setState({
      effect: style,
      effectsVisible: false,
      showInfo: true
    });
    this.openEffectUrl(style);
  };

  componentWillMount() {
    let href = window.location.href;
    //href = href.replace('localhost:3000', '52.169.197.190')
    //href = href.replace('apps.sentinel-hub.com/sentinel-playground-social', '52.169.197.190')

    shortenUrl(href)
      .then(res => {
        let shortUrl = res.data.id + ' by @sinergise #SentinelHub #RemoteSensing #EarthObservation';
        let link = `https://twitter.com/home?status=${encodeURIComponent(shortUrl)}`;

        let linkedInShare = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
          res.data.id
        )}`;

        this.setState({
          twitterShare: link,
          linkedInShare: linkedInShare
        });
      })
      .catch(err => {
        console.error(err);
        this.setState({
          twitterShare: null,
          linkedInShare: null
        });
      });
  }

  componentDidMount() {
    if (!HTMLCanvasElement.prototype.toBlob) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function(callback, type, quality) {
          var binStr = atob(this.toDataURL(type, quality).split(',')[1]),
            len = binStr.length,
            arr = new Uint8Array(len);

          for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
          }

          callback(new Blob([arr], { type: type || 'image/png' }));
        }
      });
    }
  }

  openEffectUrl(style) {
    this.image.getCanvas().toBlob(blob => {
      var data = new FormData();
      data.append('input_image', blob);
      data.append('style', style);

      request
        .post(`http://turbo.deepart.io/api/post/`, data)
        .then(res => {
          setTimeout(() => {
            // this.setState({showInfo: false})
            let image = new Image();
            image.crossOrigin = 'Anonymous';
            let deepartImg = new Image();
            deepartImg.src = deepart;
            image.src = `http://turbo.deepart.io/media/output/${res.data}.jpg`;
            image.onload = () => {
              let canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              let ctx = canvas.getContext('2d');
              ctx.drawImage(image, 0, 0);
              ctx.drawImage(
                deepartImg,
                image.width - deepartImg.width - 10,
                image.height - deepartImg.height - 10
              );
              ctx.font = 'bold 20px';
              ctx.strokeStyle = 'rgba(0,0,0, 0.4)';
              ctx.lineWidth = 2;
              ctx.strokeText('PPM', image.width - 130, image.height - 14);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.fillText('PPM', image.width - 130, image.height - 14);
              this.setState({ downloadUrl: canvas.toDataURL() });
            };
            image.onerror = () => {
              this.setState({ hasError: true });
            };
          }, 2500);
        })
        .catch(e => this.setState({ showInfo: false, hasError: true }));
    });
  }

  toggleEffectsPanel = () => {
    this.setState({ effectsVisible: !this.state.effectsVisible, downloadUrl: '' });
  };

  componentWillUnmount() {
    this.setState({ hasError: false });
  }

  popup = (link, title) => {
    if (link === null) return;

    let newWindow = window.open(link, title, 'height=300,width=450');
    if (window.focus) {
      newWindow.focus();
    }
    return false;
  };

  render() {
    const { imgUrl, onCopy } = this.props;
    const {
      deepartStyles,
      effectsVisible,
      showInfo,
      hasError,
      downloadUrl,
      shortLink
    } = this.state;
    const { sharingMode } = Store.current;

    let showImageLink = `${window.location.href}&showImage`;
    //showImageLink = showImageLink.replace('/&showImage', '&showImage/')

    let href = window.location.href;

    href = href.replace('&sharingMode=true', '');
    //href = href.replace('localhost:3000', 'apps.sentinel-hub.com/sentinel-playground')
    //href = href.replace('localhost:3000', '52.169.197.190')
    //href = href.replace('apps.sentinel-hub.com/sentinel-playground-social', '52.169.197.190')
    let facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(href)}`;
    let linkedInShare = this.state.linkedInShare;
    let twitterShare = this.state.twitterShare;

    return (
      <div>
        <ImageWithLoading imageUrl={imgUrl} ref={e => (this.image = e)} />
        {/*<div
          className="deepartPanel"
          style={{ display: effectsVisible ? "block" : "none" }}
        >
            <a onClick={() => this.setState({ effectsVisible: false })}>
                <i className="fa fa-close" />
            </a>
            <p>Create <a href="http://turbo.deepart.io/" target="_blank">Deepart</a> image from this scene. New image will open in new window.</p>
          {Object.keys(deepartStyles)
            .map((style, i) => (
              <img
                key={i}
                onClick={() => this.setEffect(style)}
                className={this.state.effect === style && "active"}
                src={deepartStyles[style]}
              />
            ))}
        </div>*/}
        {showInfo && (
          <div className="deepartInfo">
            <div>
              {downloadUrl === '' ? (
                'Preparing Deepart image. Please wait .. '
              ) : (
                <div className="downloadImage">
                  <a
                    className="close"
                    onClick={e => {
                      this.setState({ showInfo: false, hasError: false });
                      e.stopPropagation();
                    }}
                  >
                    <i className="fa fa-close" />
                  </a>
                  <a
                    href={downloadUrl}
                    onClick={() => this.setState({ showInfo: false, downloadUrl: '' })}
                    download={`Sentinel_Hub_image_${moment().format('YYYY-MM-DD')}.jpg`}
                  >
                    <img src={downloadUrl} alt="Deepart image" />
                  </a>
                  <br />
                  <a
                    href={downloadUrl}
                    className="btn"
                    onClick={() => this.setState({ showInfo: false, downloadUrl: '' })}
                    download={`Sentinel_Hub_image_${moment().format('YYYY-MM-DD')}.jpg`}
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
        {hasError && (
          <div className="deepartInfo">
            <div>
              An error occured. Please try again later.
              <a onClick={() => this.setState({ showInfo: false, hasError: false })}>
                <i className="fa fa-close" />
              </a>
            </div>
          </div>
        )}
        <div className="shareBar">
          <ClipboardButton className="btn" onSuccess={onCopy} data-clipboard-text={showImageLink}>
            <i className="fa fa-clipboard" />Copy URL
          </ClipboardButton>
          <a className="btn" href={imgUrl} download>
            <i className="fa fa-download" />Download image
          </a>
{/* 
          {true && (
            <span>
              &nbsp;|&nbsp;
              <a
                className="btn"
                href="javascript:void(0)"
                onClick={() => this.popup(facebookShare, 'Share on Facebook')}
              >
                <i className="fa fa-facebook" style={{ marginRight: 0 }} />
              </a>
              <a
                className={'btn' + (twitterShare === null ? ' disabled' : '')}
                href={twitterShare}
                target="_blank"
              >
                <i className="fa fa-twitter" style={{ marginRight: 0 }} />
              </a>
              <a
                className={'btn' + (linkedInShare === null ? ' disabled' : '')}
                href="javascript:void(0)"
                onClick={() => this.popup(linkedInShare, 'Share on LinkedIn')}
              >
                <i className="fa fa-linkedin" style={{ marginRight: 0 }} />
              </a>
            </span>
          )} */}

          {/*<a className="btn" onClick={this.toggleEffectsPanel}>
            <i className="fa fa-paint-brush" />
            {this.state.effectsVisible ? "Hide effects" : "Artistic effects"}
          </a>*/}
        </div>
      </div>
    );
  }
}


export default GenerateImagePanel;
