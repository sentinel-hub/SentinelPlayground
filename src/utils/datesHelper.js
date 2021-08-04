import moment from 'moment';
import axios from 'axios';
import Store from '../store';
import { calcBboxFromXY } from './coords';

function resetAll() {
  Store.setAvailableDates([]);
  Store.setDatesCcMap({});
  Store.setPrevDate(null);
  Store.setNextDate(null);
}

export function queryDates(date) {
  resetAll();
  const { lat, lng, zoom, dateFormat, selectedDate, activeDatasource } = Store.current;

  const bbox = calcBboxFromXY([lat, lng], zoom);
  const currDate = moment(date || selectedDate);
  const { from, to } = dateBuffer(currDate, dateFormat);
  if (!activeDatasource.datesSupported) {
    return new Promise((resolve, reject) => resolve([]));
  }

  return new Promise((resolve, reject) => {
    axios
      .get(getWfsUrl({ from, to, bbox }))
      .then(res => {
        const {
          data: { features }
        } = res;
        const datesArr = features.map(value => {
          let date = value.properties.date;
          let cc = value.properties.cloudCoverPercentage
            ? value.properties.cloudCoverPercentage
            : 0;
          cc = Math.round(cc);
          return {
            date,
            cc
          };
        });

        resolve(datesArr);
      })
      .catch(e => {
        reject(e);
        console.error('error fetching dates', e);
      });
  });
}

export function getClosestNextDate(previous = true) {
  const { availableDates, selectedDate } = Store.current;
  const goal = selectedDate.valueOf();
  let final = availableDates.filter(ad =>
    previous ? moment(ad.date).valueOf() < goal : moment(ad.date).valueOf() > goal
  );
  if (final.length === 0) {
    return null;
  } else {
    const closestDate = final.reduce((prev, curr) => {
      let el =
        Math.abs(moment(curr.date).valueOf() - goal) < Math.abs(moment(prev.date).valueOf() - goal)
          ? curr
          : prev;

      return el;
    });

    return closestDate.date;
  }
}

function dateBuffer(formattedTimePoint, dateFormat) {
  const before = moment(formattedTimePoint)
    // .startOf('month')
    .subtract(1, 'month')
    .format(dateFormat);

  const after = moment(formattedTimePoint)
    .endOf('month')
    .add(1, 'month')
    .format(dateFormat);

  const buffer = {
    from: before,
    to: after
  };
  return buffer;
}

function getWfsUrl({ from, to, bbox }) {
  const {
    activeDatasource: { id, url, typeNames }
  } = Store.current;
  const maxFeatures = 100;
  let now = new Date().valueOf();

  return `${url.replace(
    'wms',
    'wfs'
  )}?test=${now}&service=WFS&version=2.0.0&request=GetFeature&time=${from}/${to}/P1D&typenames=${typeNames}&maxfeatures=${maxFeatures}&srsname=EPSG:3857&bbox=${bbox}&outputformat=application/json`;
}

export function getSelectedDatewithCC() {
  const { availableDates, selectedDate } = Store.current;
  return new Promise((resolve, reject) => {
    const selected = selectedDate.valueOf();
    const foundDate = availableDates.filter(ad => moment(ad.date).isSame(selected));
    if (foundDate.length !== 0) {
      resolve(foundDate[0]);
    }
    if (foundDate.length === 0) {
      reject('no dates found');
    }
  });
}
