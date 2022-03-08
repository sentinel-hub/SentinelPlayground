import React from 'react';

export default class WMSImage extends React.Component {
  render() {
    const { src, alt } = this.props;
    return <img className="icon" crossOrigin="Anonymous" src={src} alt={alt} />;
  }
}
