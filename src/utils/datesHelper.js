import moment from "moment";
import axios from "axios";
import { sortedUniqBy } from "lodash";
import Store from "../store";
import { calcBboxFromXY } from "./coords";
import { CacheMasterSupreme } from "./cacheUtils";

const MAX_TIME_INTERVAL = 88; // days
const MAX_TIME_INTERVAL_MILIS = 60 * 60 * 24 * 1000 * MAX_TIME_INTERVAL;

// cache
const cache = new CacheMasterSupreme();
window.cache = cache;

export function getDatesWithCc(from, to, dateFormat) {
  let bbox = getBbox();
  let crs = getCrs();
  let dates = getBoundedDates(from, to, dateFormat);

  let promises = [];
  for (let i = 0; i < dates.length; i++) {
    promises.push(getWfsPromiseViaCache(dates[i][0], dates[i][1], bbox, crs));
  }

  return Promise.all(promises)
    .then(values => {
      let datesCc = [].concat(...values);

      // sort ASC
      datesCc = datesCc.sort((a, b) => {
        let _a = moment(a.date, dateFormat).unix();
        let _b = moment(b.date, dateFormat).unix();

        return _a - _b;
      });

      // uniq
      datesCc = sortedUniqBy(datesCc, "date");

      return datesCc;
    })
    .catch(reason => {
      console.error(reason);
      return [];
    });
}

function getBoundedDates(from, to, dateFormat) {
  // order
  let _from = moment(from, dateFormat).unix() * 1000;
  let _to = moment(to, dateFormat).unix() * 1000;

  let __from = Math.min(_from, _to);
  let __to = Math.max(_from, _to);

  _from = __from;
  _to = __to;

  // less than 88 days
  if (_to - _from < MAX_TIME_INTERVAL_MILIS) {
    _from = moment(_from).format(dateFormat);
    _to = moment(_to).format(dateFormat);

    return [[_from, _to]];
  }

  // more than 88 days
  let _arr = [];
  let _current = moment(_from).add(MAX_TIME_INTERVAL, "days").unix() * 1000;

  _arr.push([_from, _current]);
  while (_current < _to) {
    let _tmp = _current;


    _current = moment(_current).add(MAX_TIME_INTERVAL, "days").unix() * 1000;
    if (_current > _to) {
      _current = moment(_current).subtract(MAX_TIME_INTERVAL, "days").unix() *
        1000;
      break;
    }

    _arr.push([_tmp, _current]);
  }
  _arr.push([_current, _to]);

  _arr = _arr.map(value => {
    let from_ = moment(value[0]).format(dateFormat);
    let to_ = moment(value[1]).format(dateFormat);

    return [from_, to_];
  });

  return _arr;
}

function getBbox() {
  const { lat, lng, zoom } = Store.current;

  let bbox = calcBboxFromXY([lat, lng], zoom);

  return bbox;
}

function getCrs() {
  return "EPSG:3857";
}

function getWfsPromise(formattedFrom, formattedTo, bbox, crs) {
  let url = getWfsUrl(formattedFrom, formattedTo, bbox, crs);

  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then(function(response) {
        resolve(datesAndCcFromResponse(response));
      })
      .catch(function(error) {
        reject();
      });
  });
}

function getWfsPromiseViaCache(formattedFrom, formattedTo, bbox, crs) {
  let obj = {
    from: formattedFrom,
    to: formattedTo,
    bbox,
    crs
  };

  let inCache = cache.isIn(obj);

  if (inCache) return cache.get(obj);

  let promise = getWfsPromise(formattedFrom, formattedTo, bbox, crs);
  cache.set(obj, promise);

  return promise;
}

function getWfsUrl(from, to, bbox, crs) {
  const { activeDatasource: {id, url} } = Store.current;
  let tileName = `${id}.TILE`

  const maxFeatures = 100;
  let now = (new Date).getTime()

  return `${url.replace('wms', 'wfs')}?test=${now}&service=WFS&version=2.0.0&request=GetFeature&time=${from}/${to}/P1D&typenames=${tileName}&maxfeatures=${maxFeatures}&srsname=${crs}&bbox=${bbox}&outputformat=application/json`;
}

function datesAndCcFromResponse(response) {
  let datesAndCc = [];

  try {
    datesAndCc = response.data.features.map(value => {
      let date = value.properties.date;
      let cc = value.properties.cloudCoverPercentage;
      cc = Math.round(cc);

      return {
        date,
        cc
      };
    });
  } catch (e) {}

  return datesAndCc;
}

export function queryDates2(from, to, justQuery = false) {
  // prepare Store
  if (!justQuery) {
    Store.setAvailableDates([]);
    Store.setDatesCcMap({});
    Store.setPrevDate(null);
    Store.setNextDate(null);
  }
  // end

  const { selectedDate, dateFormat, maxcc } = Store.current;

  if (from == undefined)
    from = moment(selectedDate, dateFormat).startOf("month").format(dateFormat);
  if (to == undefined)
    to = moment(selectedDate, dateFormat).endOf("month").format(dateFormat);

  getDatesWithCc(from, to, dateFormat).then(value => {
    let dates = value;

    let formattedSelectedDate = selectedDate.format(dateFormat);
    let { prev, next } = getPrevNextByPoint(
      dates,
      formattedSelectedDate,
      maxcc,
      dateFormat
    );

    Store.setAvailableDates(dates);
    let map = getDatesCcMap(dates);
    Store.setDatesCcMap(map);

    if (!justQuery) {
      Store.setPrevDate(prev);
      Store.setNextDate(next);
    }
  });
}

export function getPrevNextByPoint(dates, timePoint, cc, dateFormat) {
  let unixDatesWithCc = dates.map(value => {
    let date = moment(value.date, dateFormat).unix() * 1000;

    return {
      date,
      cc: value.cc
    };
  });
  let time = moment(timePoint, dateFormat).unix() * 1000;

  // prev
  let prev = null;
  let prevs = unixDatesWithCc
    .filter(value => {
      return value.date < time && value.cc <= cc;
    })
    .sort((a, b) => b.date - a.date);
  if (prevs.length > 0) {
    prev = prevs[0];
    prev = moment(prev.date).format(dateFormat);
  }

  // next
  let next = null;
  let nexts = unixDatesWithCc
    .filter(value => {
      return value.date > time && value.cc <= cc;
    })
    .sort((a, b) => a.date - b.date);
  if (nexts.length > 0) {
    next = nexts[0];
    next = moment(next.date).format(dateFormat);
  }


  return { prev, next };
}

// date centering and expansion
export function generateFromTo(formattedTimePoint, dateFormat) {
  // center of month where formattedTimePoint resides
  let centerOfMonth = getCenterOfMonth(formattedTimePoint, dateFormat);

  // first expansion interval
  let halfOfInterval = Math.floor(MAX_TIME_INTERVAL / 2);
  let from_1 = moment(centerOfMonth).subtract(halfOfInterval, "days");
  let to_1 = moment(centerOfMonth).add(halfOfInterval, "days");

  // second expansion
  let from_2 = from_1.subtract(MAX_TIME_INTERVAL - 1, "days");
  let to_2 = to_1.add(MAX_TIME_INTERVAL - 1, "days");

  return {
    from: from_2.format(dateFormat),
    to: to_2.format(dateFormat)
  };
}

function getCenterOfMonth(formattedTimePoint, dateFormat) {
  let startOfMonth = moment(formattedTimePoint, dateFormat)
    .startOf("month")
    .unix() * 1000;
  let endOfMonth = moment(formattedTimePoint, dateFormat)
    .startOf("month")
    .unix() * 1000;

  let centerOfMonth = (startOfMonth + endOfMonth) / 2;
  centerOfMonth = moment(centerOfMonth).format(dateFormat);

  return centerOfMonth;
}

export function adjustInterval(from, to, dateFormat) {
  // get global limits
  const { minDate, maxDate } = Store.current;
  if (!minDate || !maxDate) return
  let globalStart_unix = moment(minDate, dateFormat).unix() * 1000;
  let globalEnd_unix = moment(maxDate).unix() * 1000;

  let from_unix = moment(from, dateFormat).unix() * 1000;
  let to_unix = moment(to, dateFormat).unix() * 1000;

  // well inside the interval
  if (from_unix > globalStart_unix && to_unix < globalEnd_unix)
    return { from, to };

  // from is before the global start
  if (from_unix < globalStart_unix) {
    let dt = globalStart_unix - from_unix;
    dt = getDaysFromMilis(dt);

    let newFrom = moment(from_unix).add(dt, "days").format(dateFormat);
    let newTo = moment(to_unix).add(dt, "days").format(dateFormat);

    return {
      from: newFrom,
      to: newTo
    };
  }

  // to is after the global end
  if (to_unix > globalEnd_unix) {
    let dt = to_unix - globalEnd_unix;
    dt = getDaysFromMilis(dt);

    let newFrom = moment(from_unix).subtract(dt, "days").format(dateFormat);
    let newTo = moment(to_unix).subtract(dt, "days").format(dateFormat);

    return {
      from: newFrom,
      to: newTo
    };
  }

  return { from, to };
}

function getDaysFromMilis(milis) {
  let day = 60 * 60 * 24 * 1000;

  let days = milis / day;
  days = Math.ceil(days);

  return days;
}

export function manipulateFromTo(dateFrom, dateTo) {
  let dateFrom_type = (typeof dateFrom).toLowerCase();
  let dateTo_type = (typeof dateTo).toLowerCase();
  const { dateFormat } = Store.current

  let _from = null;
  let _to = null;

  if (dateFrom_type !== "string" && dateTo_type !== "string") {
    const { selectedDate } = Store.current;

    let { from, to } = generateFromTo(selectedDate, dateFormat);
    let adjustedInterval = adjustInterval(from, to, dateFormat);

    _from = adjustedInterval.from;
    _to = adjustedInterval.to;
  } else {
    window.lastValidFrom = dateFrom
    window.lastValidTo = dateTo

    _from = dateFrom;
    _to = dateTo;
  }

  return {
    _from,
    _to
  };
}

function getDatesCcMap(dates) {
  let tmp = {};

  dates.forEach(value => {
    let key = value.date;
    let val = value.cc;

    tmp[key] = val;
  });

  return tmp;
}
