import React from 'react';
import Store from '../store';
import './DevTools.scss';

export default class DevTools extends React.Component {
  toggleDevMode() {
    const { devModalVisible } = Store.current;
    Store.setDevModalVisibility(!devModalVisible);
  }

  render() {
    let insertClass = this.props.insertClass;

    return (
      <div
        title="Integration tool"
        className={
          'DevTools floatItem pull-right' + (insertClass !== undefined ? ' ' + insertClass : '')
        }
        onClick={this.toggleDevMode}
      >
        <i className="fa fa-wrench" />
      </div>
    );
  }
}
