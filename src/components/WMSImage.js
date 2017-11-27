import React from 'react'
import ReactDOM from 'react-dom'

class WMSImage extends React.Component {

  writeToLocalStorage() {
    const img = ReactDOM.findDOMNode(this)

    img.addEventListener("load", () => {
      var imgCanvas = document.createElement("canvas"),
         imgContext = imgCanvas.getContext("2d");
      
      // Make sure canvas is as big as the picture
      let imgWidth = img.width
      let imgHeight = img.height
      imgCanvas.width = imgWidth;
      imgCanvas.height = imgHeight;

      // Draw image into canvas element
      imgContext.drawImage(img, 0, 0, imgWidth, imgHeight);
      // Get canvas contents as a data URL
      var imgAsDataURL = imgCanvas.toDataURL("image/png");
      this.props.onBase64Gen(imgAsDataURL)
    })
  }

  componentDidMount() {
    // this.writeToLocalStorage()
  }

  render() {
    return <img className="icon" crossOrigin="Anonymous" src={this.props.src}/>
  }
}

WMSImage.PropTypes = {
  src:              React.PropTypes.string.isRequired,
  onBase64Gen:      React.PropTypes.func
}
export default WMSImage;
