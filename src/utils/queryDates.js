import Store from "./../store";
import {queryAvailableDates, getPrevNextByPoint} from "./ajax";
import moment from 'moment';

export function queryDates(dateFrom, dateTo, justQuery = false) {
    if(!justQuery) {
      Store.setAvailableDates([]);
      Store.setAvailableDatesAllCc([]);
      Store.setPrevDate(null)
      Store.setNextDate(null)
    }
    
    if (dateTo) {
      let p1 = queryAvailableDates({ from: dateFrom, to: dateTo });
      let p2 = queryAvailableDates({ from: dateFrom, to: dateTo }, 100);

      Promise.all([p1, p2])
      .then(values => {
        if(values[0] === undefined || values[1] === undefined) return

        const {selectedDate, dateFormat} = Store.current
        let date = selectedDate.format(dateFormat)
        const {prev,next} = getPrevNextByPoint(values[0].dates, date, dateFormat)
        Store.setAvailableDates(values[0].dates);
        Store.setAvailableDatesAllCc(values[1].dates);

        if(!justQuery) {
          Store.setPrevDate(prev)
          Store.setNextDate(next)
        }
      })
    } else {
      const newDateFrom = moment(Store.current.selectedDate)
        .startOf("month")
        .format("YYYY-MM-DD"),
        newDateTo = moment(Store.current.selectedDate)
          .endOf("month")
          .format("YYYY-MM-DD");
      let p1 = queryAvailableDates({ from: newDateFrom, to: newDateTo });
      let p2 = queryAvailableDates({ from: newDateFrom, to: newDateTo }, 100);

      Promise.all([p1, p2])
      .then(values => {
        if(values[0] === undefined || values[1] === undefined) return
        
        const {selectedDate, dateFormat} = Store.current
        let date = selectedDate.format(dateFormat)
        const {prev,next} = getPrevNextByPoint(values[0].dates, date, dateFormat)
        Store.setAvailableDates(values[0].dates);
        Store.setAvailableDatesAllCc(values[1].dates);
        
        if(!justQuery) {
          Store.setPrevDate(prev)
          Store.setNextDate(next)
        }
      })
    }

  }