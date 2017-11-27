import React, {PropTypes} from 'react'
import Geosuggest from 'react-geosuggest'
import onClickOutside from 'react-onclickoutside'

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearchVisible: false
    }
    this.handleClickOutside = this.handleClickOutside.bind(this); 
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize(nextToolsVisible = null) {
    let toolsVisible = null
      try {
        toolsVisible = this.props.toolsVisible
      } catch(e) {}

    if(toolsVisible === null) return

    if(nextToolsVisible !== null){
      toolsVisible = nextToolsVisible
    }

    let baseWidth = 130 // bottom equation for width 130 !!!.. non-parametrized :(
    let viewport = window.innerWidth;
    let searchBox = document.querySelector('#searchBox .geosuggest')
    
    if(searchBox ===null) return

    if(viewport > 700 && viewport < 811 && toolsVisible) {
      // f(x)   = k*x + n
      // f(700) = k*700 + n = 40
      // f(810) = k*810 + n = 130
      // wolframalpha to the rescue :)
      // https://www.wolframalpha.com/input/?i=k*700+%2B+n%3D+40,+k*810+%2B+n+%3D+130
      // as of 23.03.2017
      // k = 9/11, n = -5860/11
      let newWidth = (9/11)*viewport + (-5860/11)
      newWidth = Math.floor(newWidth)

      searchBox.style.width = newWidth + 'px'
    } else {
      searchBox.style.width = `${baseWidth}px`
    }
  }

  componentWillUpdate(nextProps, nextSize) {
    let nextToolsVisible = nextProps.toolsVisible

    if(nextToolsVisible) {
      this.handleResize(nextProps.toolsVisible)
    } else {
      setTimeout(() => {
        this.handleResize()
      }, 700) // transition is of the same speed as #tools
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
  onLocationPicked: React.PropTypes.func,
  toolsVisible: React.PropTypes.bool
};

export default onClickOutside(SearchBox)
