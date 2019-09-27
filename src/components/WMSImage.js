import React from 'react';

export default class WMSImage extends React.Component {
  render() {
    const { src } = this.props;
    return <img className="icon" crossOrigin="Anonymous" src={src} />;
  }
}
