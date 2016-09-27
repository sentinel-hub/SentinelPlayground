import React, {PropTypes} from 'react'
import Geosuggest from 'react-geosuggest'
import onClickOutside from 'react-onclickoutside'

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearchVisible: false
    }
  }
  handleClickOutside() {
    this.setState({isSearchVisible: false});
  }

  render() {
    return (<div id="searchBox" className={(this.state.isSearchVisible && 'active') + ' floatItem'}>
      <i onClick={() => {this.setState({isSearchVisible: !this.state.isSearchVisible})}} className="fa fa-search"></i>
      <span>
            <Geosuggest onSuggestSelect={this.props.onLocationPicked} className="geoLocation"/>
          </span>
    </div>);
  }
}

SearchBox.propTypes = {
  onLocationPicked: React.PropTypes.func
};

export default onClickOutside(SearchBox)
