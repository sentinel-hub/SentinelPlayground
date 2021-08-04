import React, { Component } from 'react';
import { DateField, MonthView } from 'react-date-picker';
import moment from 'moment';

export default class Timepicker extends Component {
  constructor(props) {
    super(props);

    const {
      dateRange: { from, to },
      dateFormat
    } = this.props;
    this.state = {
      fromText: from.format(dateFormat),
      toText: to.format(dateFormat),
      from,
      to
    };
  }

  onTextChange = e => {
    this.setState({ dateString: e });
  };

  onBlur = () => {};

  render() {
    const { dateFormat, from, to, fromText, toText } = this.state;
    return (
      <div>
        From:
        <DateField
          dateFormat={dateFormat}
          updateOnDateClick={true}
          strict={false}
          // onFocus={() => this.setState({ isDateVisible: true })}
          clearIcon={false}
          showClock={false}
          // onChange={this.onChange}
          onTextChange={e => this.onTextChange(e, 'from')}
          onExpand={this.props.onExpand}
          onBlur={this.onBlur}
          expanded={this.state.isDateVisible}
          minDate={Store.current.minDate}
          maxDate={Store.current.maxDate}
          value={fromText}
        >
          <MonthView
            onChange={date => this.onDayPicked(date, 'from')}
            theme={null}
            onNavClick={(dir, date) => {
              let newDateFrom, newDateTo;
              if ([-2, 2].includes(dir)) {
                if (dir === -2) dir = -1;
                if (dir === 2) dir = 1;
                newDateFrom = moment(date)
                  .add(dir, 'years')
                  .startOf('month')
                  .format('YYYY-MM-DD');
                newDateTo = moment(date)
                  .add(dir, 'years')
                  .endOf('month')
                  .format('YYYY-MM-DD');
              } else {
                newDateFrom = moment(date)
                  .add(dir, 'months')
                  .startOf('month')
                  .format('YYYY-MM-DD');
                newDateTo = moment(date)
                  .add(dir, 'months')
                  .endOf('month')
                  .format('YYYY-MM-DD');
              }
              this.props.onNavClick(newDateFrom, newDateTo, true);
            }}
            onRenderDay={this.onDay}
            highlightWeekends={true}
            highlightToday={true}
            weekNumbers={false}
            highlightRangeOnMouseMove={false}
            weekStartDay={1}
            footer={false}
          />
        </DateField>
      </div>
    );
  }
}
