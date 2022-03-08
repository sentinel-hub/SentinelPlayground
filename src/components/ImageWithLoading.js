import React from 'react';
import sglogo from './sglogo.png';
import deepart from './deepart.png';

class ImageWithStatusText extends React.Component {
  state = {
    loaded: false,
    error: false,
    errorMsg: '',
    effectImg: '',
    hasEffect: false
  };

  handleImageLoaded = () => {
    this.setState({ loaded: true, error: false });
    this.canvas = this.convertImageToCanvas();
  };

  handleImageError = e => {
    this.setState({ loaded: false, error: true, errorMsg: e.message });
  };

  renderSpinner() {
    if (this.state.error) {
      return <div className="errorMsg">Error loading image: {this.state.errorMsg}</div>;
    }
    if (!this.state.loaded) {
      return (
        <span className="spinner">
          <i className="fa fa-cog fa-spin fa-3x fa-fw" />
          Generating image ...
        </span>
      );
    }
  }

  getCanvas = () => this.canvas || null;

  convertImageToCanvas() {
    const image = document.getElementById('sentinelImage'),
      deepart = document.getElementById('deepart');
    let canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    // ctx.font = "20px";
    // ctx.fillStyle = "white";
    // ctx.drawImage(deepart, image.width - deepart.width - 10, image.height - deepart.height - 10);
    // ctx.fillText("PPM", image.width /2, image.height - 20);
    return canvas;
  }

  componentWillUnmount() {
    this.setState({
      hasEffect: false,
      effectImg: '',
      loaded: false
    });
  }

  render() {
    let loaded = this.state.loaded && !this.state.error;
    return (
      <div className="imageWithLoader">
        {this.renderSpinner()}
        {!this.state.hasEffect && (
          <img
            role="presentation"
            crossOrigin="Anonymous"
            id="sentinelImage"
            alt="image"
            style={{ display: loaded ? 'block' : 'none' }}
            src={this.props.imageUrl}
            onLoad={this.handleImageLoaded}
            onError={e => this.handleImageError(e)}
          />
        )}
        <img src={deepart} style={{ display: 'none' }} id="deepart" alt="deepart image" />
        {this.state.hasEffect && <img src={this.state.effectImg} alt="image with effects" />}
      </div>
    );
  }
}
export default ImageWithStatusText;
