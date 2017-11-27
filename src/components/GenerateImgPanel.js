import React, { Component, PropTypes } from 'react'
import ClipboardButton from 'react-clipboard.js'
import ImageWithLoading from './ImageWithLoading'
import request from 'axios'
import deepart from './deepart.png'
import moment from 'moment'
import Store from '../store'

import './GenerateImgPanel.scss'

class GenerateImagePanel extends Component {
  state = {
    effectsVisible: false,
    effect: 0,
    showInfo: false,
    hasError: false,
    downloadUrl: '',
    twitterShare: null,
    linkedInShare: null
  }

  componentWillUnmount() {
    this.setState({ hasError: false })
  }

  popup = (link, title) => {
    if (link === null) return

    let newWindow = window.open(link, title, 'height=300,width=450')
    if (window.focus) {
      newWindow.focus()
    }
    return false
  }

  render() {
    const { imgUrl, onCopy } = this.props
    const { deepartStyles, effectsVisible, showInfo, hasError, downloadUrl, shortLink } = this.state
    const { sharingMode } = Store.current

    let showImageLink = `${window.location.href}&showImage`

    let href = window.location.href

    href = href.replace('&sharingMode=true', '')
    let facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(href)}`
    let linkedInShare = this.state.linkedInShare
    let twitterShare = this.state.twitterShare

    return (
      <div>
        <ImageWithLoading imageUrl={imgUrl} ref={e => (this.image = e)} />
        {showInfo && (
          <div className="deepartInfo">
            <div>
              <div className="downloadImage">
                <a
                  className="close"
                  onClick={e => {
                    this.setState({ showInfo: false, hasError: false })
                    e.stopPropagation()
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
              <a className={'btn' + (twitterShare === null ? ' disabled' : '')} href={twitterShare} target="_blank">
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
          )}
        </div>
      </div>
    )
  }
}

GenerateImagePanel.propTypes = {
  imgUrl: React.PropTypes.string,
  onCopy: React.PropTypes.func,
  onSetEffect: React.PropTypes.func
}

export default GenerateImagePanel
