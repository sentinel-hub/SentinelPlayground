import React from 'react';

class ImageWithStatusText extends React.Component {
    constructor(props) {
        super(props);
        this.state = {loaded: false, error: false};
    }

    handleImageLoaded() {
        this.setState({loaded: true, error: false});
    }

    handleImageError() {
        this.setState({loaded: false, error: true});
    }

    renderSpinner() {
        if (!this.state.loaded) {
            return (
                <span className="spinner">
                    <i className="fa fa-cog fa-spin fa-3x fa-fw"/>Generating image ...
                </span>
            );
        }
        if (this.state.error) {
            return (
                <div className="errorMsg">Error loading image!</div>
            )
        }
    }

    render() {
        let loaded = this.state.loaded && !this.state.error
        return (
            <div className="imageWithLoader">
                {this.renderSpinner()}
                <img role="presentation"
                     style={{display: loaded ? 'block' : 'none'}}
                    src={this.props.imageUrl}
                    onLoad={this.handleImageLoaded.bind(this)}
                    onError={this.handleImageError.bind(this)}
                />
            </div>
        );
    }
}
export default ImageWithStatusText;