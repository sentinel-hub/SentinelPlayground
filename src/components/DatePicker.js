import React from 'react';
import { DateField, MonthView } from 'react-date-picker';
import Store from '../store';
import moment from 'moment';
import debounce from 'lodash/debounce';
import { connect } from 'react-redux';
import { getClosestNextDate, queryDates, getSelectedDatewithCC } from '../utils/datesHelper';

import 'react-date-picker/index.css';

class MyDatePicker extends React.Component {
  constructor(props) {
    super(props);
    const { selectedDate, dateFormat } = Store.current;
    let dateString = selectedDate.format(dateFormat) || moment().format(dateFormat);

    this.state = {
      isDateVisible: false,
      presumedSelectedDate: dateString,
      originalDateString: dateString,
      dateString: dateString
    };
    this.syncDates = debounce(this.syncDates, 200);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    this.syncDates();
  }

  handleClickOutside() {
    this.setState({ isDateVisible: false });
  }

  onDay = props => {
    const { availableDates, dateFormat, maxcc, activeDatasource } = Store.current;
    let propDate = props.dateMoment.format(dateFormat);

    let availableDay = availableDates.find(value => value.date === propDate);
    let isInavailableDates = availableDay !== undefined;

    if (!isInavailableDates) return props;

    let className = props.className;
    if (isInavailableDates && availableDay.cc > maxcc)
      props.className = className + ' hasDataFullCloud';

    if (isInavailableDates && availableDay.cc <= maxcc) props.className = className + ' hasData';

    props.title = `Cloud coverage: ${
      activeDatasource.cloudCoverageSupported ? availableDay.cc : 'N/A'
    }`;

    return props;
  };

  syncDates = e => {
    queryDates(e)
      .then(res => {
        Store.setAvailableDates(res);
        Store.setPrevDate(getClosestNextDate(true));
        Store.setNextDate(getClosestNextDate(false));
        getSelectedDatewithCC()
          .then(date => {
            if (date.cc > Store.current.maxcc) Store.setMaxcc(date.cc);
          })
          .catch(e => {
            console.error(e);
          });
      })
      .catch(e => {
        console.error(e);
      });
  };

  onDayPicked = e => {
    this.setState({ isDateVisible: false });
    document.activeElement.blur(); //lose focus so you can pick datepicker again
    Store.setDate(moment(e));
    this.syncDates(moment(e, Store.current.dateFormat));
  };

  onChange = e => {
    this.setState({ presumedSelectedDate: e });
  };

  onTextChange = value => {
    const { dateFormat } = Store.current;
    this.setState({ dateString: value });
    const presumedSelectedDate = moment(this.state.presumedSelectedDate, dateFormat);
    this.syncDates(value);
    this.props.onExpand(undefined, false, true);
    if (this.state.dateString !== presumedSelectedDate) {
      return;
    }
    Store.setDate(presumedSelectedDate);
  };

  toggleIsDateVisible = () => {
    this.setState({
      isDateVisible: !this.state.isDateVisible
    });
    this.props.onExpand(undefined, false, true);
  };

  onBlur = () => {
    if (this.state.dateString.match(/^(\d{4})\-(\d{1,2})\-(\d{1,2})$/)) {
      const { dateFormat } = Store.current;
      const date = moment(this.state.dateString, dateFormat);
      if (date.isValid()) {
        this.onDayPicked(this.state.dateString);
        this.setState({
          isDateVisible: false,
          originalDateString: this.state.dateString
        });
      }
    }
  };

  componentDidUpdate() {
    const { selectedDate, dateFormat } = Store.current;
    let date = selectedDate.format(dateFormat);
    let originalDateString = this.state.originalDateString;
    date !== originalDateString &&
      this.setState({
        dateString: date,
        originalDateString: date
      });
  }

  onNextorPrev = (direction, thisDate = false) => {
    const { prevDate, nextDate, dateFormat } = Store.current;
    let newDate = direction === 'prev' ? prevDate : nextDate;
    if (newDate === null) return;
    Store.setDate(moment(newDate));
    this.syncDates(moment(newDate, dateFormat));
  };

  render() {
    const { prevDate, nextDate, dateFormat } = Store.current;

    return (
      <div
        id={this.props.id}
        className={(this.state.isDateVisible && 'active') + ' floatItem m-r-1-700 pull-right-700'}
      >
        <i
          className={'fa fa-caret-left cal-icon-left' + (prevDate === null ? ' disabled' : '')}
          title={
            prevDate !== null
              ? `Show previous available date (${prevDate})`
              : 'No previous date available'
          }
          onClick={() => this.onNextorPrev('prev')}
        />
        <i
          className={`fa fa-${this.props.icon} cal-icon-cal`}
          onClick={() => this.toggleIsDateVisible()}
        />
        <i
          className={'fa fa-caret-right cal-icon-right' + (nextDate === null ? ' disabled' : '')}
          title={
            nextDate !== null ? `Show next available date (${nextDate})` : 'No next date available'
          }
          onClick={() => this.onNextorPrev('next')}
        />
        <span>
          <DateField
            dateFormat={dateFormat}
            updateOnDateClick={false}
            strict={false}
            onFocus={() => this.setState({ isDateVisible: true })}
            clearIcon={false}
            showClock={false}
            onChange={this.onChange}
            onTextChange={this.onTextChange}
            onExpand={this.props.onExpand}
            onBlur={this.onBlur}
            expanded={this.state.isDateVisible}
            minDate={Store.current.activeDatasource.minDate}
            maxDate={Store.current.maxDate}
            value={this.state.dateString}
          >
            <MonthView
              onChange={this.onDayPicked}
              theme={null}
              onNavClick={debounce((dir, date) => {
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
              }, 200)}
              onRenderDay={this.onDay}
              highlightWeekends={true}
              highlightToday={true}
              weekNumbers={false}
              highlightRangeOnMouseMove={false}
              weekStartDay={1}
              footer={false}
            />
          </DateField>
        </span>
      </div>
    );
  }
}

export default connect(store => store)(MyDatePicker);
