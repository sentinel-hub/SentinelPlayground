import React from 'react'
import {DateField, MultiMonthView, MonthView} from 'react-date-picker';
import Store from '../store'
import moment from 'moment'
import {connect} from 'react-redux'
import onClickOutside from 'react-onclickoutside'
import {getPrevNextByPoint} from '../utils/ajax'

import 'react-date-picker/index.css'

class MyDatePicker extends React.Component {
    constructor(props) {
        super(props)

        const {selectedDate, dateFormat} = Store.current
        let dateString = selectedDate.format(dateFormat) || moment().format(dateFormat)
        
        this.state = {
          isDateVisible: false,
          presumedSelectedDate: dateString,
          originalDateString: dateString,
          dateString: dateString
        }

        this.handleClickOutside = this.handleClickOutside.bind(this); 
    }

    componentDidMount() {
        this.props.onExpand(undefined, false, true)
    }

    handleClickOutside() {
        this.setState({isDateVisible: false});
    }

    onDay = (props) => {
        const {availableDays, availableDaysAllCc, dateFormat, maxcc} = Store.current
        let propDate = props.dateMoment.format(dateFormat)

        let isInAvailableDays = availableDays.includes(propDate)
        let isInAvailableDaysAllCc = availableDaysAllCc.includes(propDate)
        let className = props.className

        if(isInAvailableDaysAllCc) {
            props.className = className + ' hasDataFullCloud'
            props.title = `more than ${maxcc}% clouds`
        }

        if(isInAvailableDays) {
            props.className = className + ' hasData'
            props.title = `less than ${maxcc}% clouds`
        }

        return props
    }

    onDayPicked = (e) => {
        this.setState({isDateVisible: false})
        document.activeElement.blur() //lose focus so you can pick datepicker again
        this.props.onSelect(e)
    }
    onChange = (e) => {
        this.setState({presumedSelectedDate: e})
    }

    onTextChange = (e) => {
        this.setState({dateString: e})

        let tmp = this.state.presumedSelectedDate
        const {dateFormat} = Store.current
        let presumedSelectedDate = moment(tmp, dateFormat)

        let isInBounds = this._isInBounds(presumedSelectedDate)
        if(!isInBounds) return

        // query and show results in MyDatePicker,
        // but don't change prev/next date since this change might not be final
        this.props.onExpand(undefined, false, true) // TODO nicer
        // .. in input field
        let whatItIs = e
        let whatItShouldBe = presumedSelectedDate.format(dateFormat)

        if(whatItIs !== whatItShouldBe) return

        // now the presumed date and the actual value in input matches
        Store.setDate(presumedSelectedDate)
    }

    onBlur = () => {
        if (this.state.dateString.match(/^(\d{4})\-(\d{1,2})\-(\d{1,2})$/)) {
            const {dateFormat} = Store.current

            let date = moment(this.state.dateString, dateFormat)
            
            if (date.isValid()) {
                this.onDayPicked(this.state.dateString)
                this.setState({isDateVisible: false, originalDateString: this.state.dateString})
                this.setDate(this.state.dateString, true)
                this.props.onSelect(date)
            }
        }
    }

    componentDidUpdate() {
        const {selectedDate, dateFormat} = Store.current
        let date = selectedDate.format(dateFormat)
        let originalDateString = this.state.originalDateString

        date !== originalDateString && this.setState({dateString: date, originalDateString: date})
    }

    setDate = (direction, thisDate=false) => {
        const {prevDate, nextDate, dateFormat, availableDays} = Store.current
        let newDate = null
        direction === 'prev' ? newDate = prevDate :''
        direction === 'next' ? newDate = nextDate :''
        thisDate ? newDate= direction : ''

        if(newDate === null) return

        const {prev, next} = getPrevNextByPoint(availableDays, newDate, dateFormat)
        this.props.onExpand(undefined, false, true)

        Store.setDate(moment(newDate, dateFormat))
        Store.setPrevDate(prev)
        Store.setNextDate(next)
    }

    // util
    _isInBounds(date) {
        const {minDate, maxDate, dateFormat} = Store.current
        let miniDate = moment(minDate, dateFormat) // Store.minDate is <string> not instance of moment

        let firstPoint = miniDate.startOf('month').unix()*1000
        let lastPoint = maxDate.endOf('month').unix()*1000
        let ourPoint = date.unix()*1000

        return ourPoint > firstPoint && ourPoint < lastPoint
    }

    render() {
        const {prevDate, nextDate, dateFormat} = Store.current

        return ( <div id={this.props.id} className={(this.state.isDateVisible && 'active') + ' floatItem m-r-1-700 pull-right-700'}>
            <i className={'fa fa-caret-left cal-icon-left' + (prevDate === null ? ' disabled' : '')}
               title={prevDate !== null ? `Show previous available date (${prevDate})` : 'No previous date available'}
               onClick={() => this.setDate('prev')}
            ></i>
            <i className={`fa fa-${this.props.icon} cal-icon-cal`}
               onClick={() => {this.setState({isDateVisible: !this.state.isDateVisible})}}
            ></i>
            <i className={'fa fa-caret-right cal-icon-right' + (nextDate === null ? ' disabled' : '')}
               title={nextDate !== null ? `Show next available date (${nextDate})` : 'No next date available'}
               onClick={() => this.setDate('next')}
            ></i>
            <span>
                <DateField
                    dateFormat={dateFormat}
                    updateOnDateClick={true}
                    strict={false}
                    clearIcon={false}
                    showClock={false}
                    onChange={this.onChange}
                    onTextChange={this.onTextChange}
                    onExpand={this.props.onExpand}
                    onBlur={this.onBlur}
                    minDate={Store.current.minDate}
                    maxDate={Store.current.maxDate}
                    value={this.state.dateString}>
                        <MonthView
                            onChange={this.onDayPicked}
                            theme={null}
                            onNavClick={ (dir,date) => {
                                let newDateFrom, newDateTo
                                if ([-2, 2].includes(dir)) {
                                    if (dir === -2) dir = -1
                                    if (dir === 2) dir = 1
                                    newDateFrom = moment(date).add(dir, 'years').startOf('month').format("YYYY-MM-DD")
                                    newDateTo = moment(date).add(dir, 'years').endOf('month').format("YYYY-MM-DD")
                                } else {
                                    newDateFrom = moment(date).add(dir, 'months').startOf('month').format("YYYY-MM-DD")
                                    newDateTo = moment(date).add(dir, 'months').endOf('month').format("YYYY-MM-DD")
                                }
                                this.props.onNavClick(newDateFrom, newDateTo, true)
                                }
                            }
                            onRenderDay={this.onDay}
                            highlightWeekends={true}
                            highlightToday={true}
                            weekNumbers={false}
                            highlightRangeOnMouseMove={false}
                            weekStartDay={1}
                            footer={false} />
                </DateField>
            </span>
        </div>)
    }
}
MyDatePicker.PropTypes = {
    onSelect: React.PropTypes.func,
    onExpand: React.PropTypes.func,
}
export default connect(store => store)(onClickOutside(MyDatePicker))


