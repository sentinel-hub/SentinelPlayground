import React, { Component } from 'react';
import moment from 'moment';

export default class Timelapse extends Component {
  state = {
    showTimepicker: false,
    dateRange: {
      from: moment().subtract(1, 'years'),
      to: moment()
    }
  };

  togglePicker = () => {
    this.setState({ showTimepicker: !this.state.showTimepicker });
  };

  setDate = dateRange => {
    this.setState({ dateRange });
  };

  render() {
    const { showTimepicker } = this.state;
    return (
      <div>
        <a onClick={this.togglePicker}>Set date</a>
        {showTimepicker && <TimePicker onPick={this.setDate} />}
      </div>
    );
  }
}
