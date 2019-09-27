import React, { Component } from 'react';
import Store from '../store';
import { connect } from 'react-redux';
import satellite from './satellite.png';
import styled from 'styled-components';
import { loadGetCapabilities } from '../utils/ajax';
import { getClosestNextDate, queryDates } from '../utils/datesHelper';
import onClickOutside from 'react-onclickoutside';

const Style = styled.div`
  position: absolute;
  right: 10px;
  z-index: 1000;
  top: 15px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);

  > a {
    display: block;
    cursor: pointer;
    width: 40px;
    height: 32px;
    opacity: 0.7;
    text-align: center;
    line-height: 42px;
    // background: #487191;

    &:hover {
      opacity: 1;
    }
    .fa {
      font-size: 20px;
    }
    img {
      margin-top: 8px;
      width: 20px;
      height: auto;
    }
  }
  > div {
    position: absolute;
    right: 0px;
    top: 41px;
    white-space: nowrap;
    background: #487191;

    h3 {
      margin: 0;
      background: #2f485c;
      padding: 10px 50px 10px 15px;
      font-size: 18px;
      color: #fff;

      i {
        position: absolute;
        right: 10px;
        top: 10px;
      }
    }

    &.loading a {
      opacity: 0.5;
      cursor: default;
    }

    a {
      display: block;
      padding: 7px 15px;
      color: #fff;
      cursor: pointer;
      transition: all ease 0.4s;

      .fa {
        margin-right: 6px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      &.active {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }
`;
class DatasourceSwitch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      showLayer: true,
      loading: false,
      sources: Store.current.datasources.filter(ds => ds.url)
    };
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  hideModal = () => this.setState({ error: null });

  switchDS = ds => {
    const { showLayer, loading } = this.state;
    const { activeDatasource: { name } } = Store.current;
    if (ds.name === name) {
      this.setState({ showLayer: !showLayer, error: null }, () => {
        this.props.onToggle && this.props.onToggle(showLayer);
      });
    } else {
      if (loading) return;
      this.setState({ showLayer: true, loading: true, error: null });

      loadGetCapabilities(ds)
        .then(() => {
          this.setState({ show: false, loading: false });
          queryDates().then(res => {
            Store.setAvailableDates(res);
            Store.setPrevDate(getClosestNextDate(true));
            Store.setNextDate(getClosestNextDate(false));
          });
        })
        .catch(e => {
          this.props.onError(`Could not load data for ${ds.name}. Please try again later.`);
          this.setState({ loading: false });
        });
    }
  };

  handleClickOutside() {
    this.setState({ show: false });
  }

  render() {
    const { activeDatasource: { name } } = Store.current;
    const { sources, show, showLayer, loading } = this.state;
    return (
      <Style>
        <a onClick={() => this.setState({ show: !show })}>
          {show ? <i className="fa fa-close" /> : <img src={satellite} />}
        </a>
        {show && (
          <div className={loading && 'loading'}>
            <h3>Datasets {loading && <i className="fa fa-spinner fa-spin" />}</h3>
            {sources.map((ds, i) => {
              const active = ds.name === name;
              return (
                <a key={i} className={active && 'active'} onClick={() => this.switchDS(ds)}>
                  <i className={`fa fa-${showLayer && active ? 'check-square' : 'square-o'}`} />
                  {ds.name}
                </a>
              );
            })}
          </div>
        )}
      </Style>
    );
  }
}

export default connect(store => store)(onClickOutside(DatasourceSwitch));
