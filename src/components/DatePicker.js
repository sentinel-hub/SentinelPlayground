import React from 'react'
import {DateField, MultiMonthView, MonthView} from 'react-date-picker';
import Store from '../store'
import {connect} from 'react-redux'
import onClickOutside from 'react-onclickoutside'
import 'react-date-picker/index.css'

class MyDatePicker extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
          isDateVisible: false
        }
    }

    handleClickOutside() {
        this.setState({isDateVisible: false});
    }

    onDay = (props) => {
        if (Store.current.availableDays.includes(props.dateMoment.format(Store.current.dateFormat))){
            props.className += ' hasData'
        }
        return props
    }

    onDayPicked = (e) => {
        this.setState({isDateVisible: false})
        document.activeElement.blur() //lose focus so you can pick datepicker again
        this.props.onSelect(e)
    }

    render() {
        return ( <div id={this.props.id} className={(this.state.isDateVisible && 'active') + ' floatItem'}>
            <i className={`fa fa-${this.props.icon}`} onClick={() => {this.setState({isDateVisible: !this.state.isDateVisible})}} ></i>
            <span>
                <DateField
                    dateFormat="YYYY-MM-DD"
                    forceValidDate={true}
                    updateOnDateClick={true}
                    showClock={false}
                    minDate={Store.current.minDate}
                    maxDate={Store.current.maxDate}
                    defaultValue={Store.current.selectedDate}>
                        <MonthView
                            onChange={this.onDayPicked}
                            theme={null}
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
    onSelect: React.PropTypes.func
}
export default connect(store => store)(onClickOutside(MyDatePicker))


