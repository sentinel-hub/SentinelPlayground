import React from 'react';
import sglogo from './sglogo.png'

class ImageWithStatusText extends React.Component {
    state = {
        loaded: false, 
        error: false, 
        errorMsg: '',
        effectImg: '',
        hasEffect: false,
    }

    handleImageLoaded = () => {
        this.setState({loaded: true, error: false})
    }

    handleImageError = (e) => {
        this.setState({loaded: false, error: true, errorMsg: e.message});
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
                <div className="errorMsg">Error loading image: {this.state.errorMsg}</div>
            )
        }
    }

    componentWillUnmount() {
        this.setState({
            hasEffect: false,
            effectImg: '',
            loaded: false
        })
    }
    
    render() {
        let loaded = this.state.loaded && !this.state.error
        return (
            <div className="imageWithLoader">
                {this.renderSpinner()}
                <img role="presentation" 
                    crossOrigin="Anonymous"
                    id="sentinelImage"
                    style={{display: loaded ? 'block' : 'none'}}
                    src={this.props.imageUrl}
                    onLoad={this.handleImageLoaded}
                    onError={e => this.handleImageError(e)}
                />
            </div>
        );
    }
}
export default ImageWithStatusText;