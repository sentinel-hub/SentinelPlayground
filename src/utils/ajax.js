import request from 'axios';
import axios from 'axios';
import Store from '../store'
import moment from 'moment'
import _ from 'lodash'

const GLOB = {}
GLOB.maxExtent = 88 // from-to has 3 months limit, DB optimization - in days

export function loadGetCapabilities() {
    return new Promise((resolve, reject) => {
        var parseString = require('xml2js').parseString;
        request.get(`${Store.getCapabilitiesUrl}&time=${new Date().valueOf()}`, { //we add time parameter so caching is prevented 
            responseType: 'text'
        }).then((res) => {
            parseString(res.data, (err, result) => {
                let layers = result.WMS_Capabilities.Capability[0].Layer[0].Layer
                var myRegexp = /^B[0-9][0-9A]/i; //excluse "B01", "B8A" etc. layer names
                let preset = null, channels = []
                let presets = Store.current.presets
                for (let l in layers) {
                    if (layers.hasOwnProperty(l)) {
                        var layerName = layers[l].Name[0]
                        const splitName = layerName.split(".")[1]
                        if (layerName === "FILL" || splitName === "FILL") break
                        if (!preset) {
                            preset = layerName; //set first layer as default selection
                        }
                        if (!myRegexp.test(layerName)) {
                            let desc = layers[l].Abstract !== undefined ? layers[l].Abstract[0] : ""
                            let legendUrl = getLegendUrl(layers[l])

                            presets[layerName] = {
                                name:  layers[l].Title[0],
                                desc:  desc,
                                image: `${Store.getFullWmsUrl}&SHOWLOGO=false&LAYERS=${layerName}&BBOX=12697069,2555251,12708076,2563048&MAXCC=20&WIDTH=40&HEIGHT=40&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=${Store.current.minDate}/2016-08-04`,
                            }
                            if (legendUrl) {
                                presets[layerName].legendUrl = legendUrl
                            }
                        } else {
                            //fill bands
                            let desc = layers[l].Abstract !== undefined ? layers[l].Abstract[0] : ""
                            let detailDesc = desc.indexOf("|") !== -1 ? layers[l].Abstract[0].split("|")[0] : desc
                            let color = desc.indexOf("|") !== -1 ? layers[l].Abstract[0].split("|")[1] : 'red'
                            channels.push({
                                name: layerName,
                                desc: detailDesc,
                                color: color
                            });
                        }
                    }
                }
                Store.setChannels   (channels)
                Store.setPresets    (presets)
                Store.setPreset     (preset)
                resolve()
            })
        }).catch(e => reject(e))
    })
}

function getLegendUrl(layer) {
    let urlCandidate
    
    try {
        layer.Style.forEach(value => {
            if(value.Name[0] === 'COLOR_MAP') {
                urlCandidate = value.LegendURL[0].OnlineResource[0].$['xlink:href']
            }
        })
    } catch(ex) {}

    return urlCandidate
}

function getSortedObject(object) {
    var sortedObject = {};

    var keys = Object.keys(object);
    keys.sort();

    if(keys[keys.length-1] === 'CUSTOM') {
        keys.unshift(keys.pop())
    }

    for (var i = 0, size = keys.length; i < size; i++) {
      let key = keys[i];
      let value = object[key];
      sortedObject[key] = value;
    }

    return sortedObject;
  }

// cache stuff
const cache = {}
window.cache = cache
let keyify = (url, polygon) => {
    let _url = JSON.stringify(url)
    let _polygon = JSON.stringify(polygon)
    return _url + _polygon
}
let isInCache = (key) => {
    return cache[key] !== undefined
}
let getFromCache = (key) => {
    return cache[key]
}
let setInCache = (key, value) => {
    cache[key] = value
}

export function queryAvailableDates(dateRange, insertCc = null) {
    let cc = null
    if(insertCc !== null)
        cc = insertCc
    else
        cc = Store.current.maxcc
    
    const {zoom, mapBounds: bounds} = Store.current,
          {from: dateFrom, to: dateTo} = dateRange

    if (zoom < 8 || _.isEmpty(bounds)) return

    return new Promise((resolve, reject) => {
        // coords
        var coords = [];
        let sw = bounds.getSouthWest().wrap(),
            se = bounds.getSouthEast().wrap(),
            ne = bounds.getNorthEast().wrap(),
            nw = bounds.getNorthWest().wrap()
            coords.push([sw.lng, sw.lat]),
            coords.push([se.lng, se.lat]),
            coords.push([ne.lng, ne.lat]),
            coords.push([nw.lng, nw.lat]),
            coords.push([sw.lng, sw.lat])
        var polygon = {
            "type": "Polygon",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:EPSG::4326"
                }
            },
            "coordinates": [coords]
        };

        // limits
        const {dateFormat, minDate} = Store.current
        let maxDate = moment().add(1, 'days').format(dateFormat)
        let _normalizeFromTo = normalizeFromTo(dateFrom, dateTo, dateFormat, minDate, maxDate)
        
        let from = _normalizeFromTo['from'] // moment
        let to = _normalizeFromTo['to'] // moment 
        let from_formatted = from.format(dateFormat)
        let to_formatted = to.format(dateFormat)
        
        // url
        let {preset, layermap, indexBaseUrl, baseWmsUrl, source} = Store.current
        let indexUrl = ''
        if (layermap && layermap[preset] !== 'S2') {
            indexUrl = `http://${baseWmsUrl}/index/landsat${layermap[preset].slice(-1)}/v2/dates`
        } else if (source === 'S3') {
            resolve({
                prev: null,
                next: null,
                dates: []
            })
            return
            indexUrl = 'http://services.eocloud.sentinel-hub.com/index/s3/v1'
        } else if (source === 'ENV') {
            indexUrl = 'http://services.eocloud.sentinel-hub.com/index/envisat/v1/finddates'
        } else {
            indexUrl = `http://${indexBaseUrl}/index/v2/finddates`
        }
        
        // Request 1
        var url = `${indexUrl}?timefrom=${from_formatted}&timeto=${to_formatted}T23:59:59&maxcc=${cc / 100}`
        
        // caching
        let key = keyify(url, polygon)
        if(isInCache(key)) {
            let val = getFromCache(key)
            resolve(val)
            return
        }

        request.post(url, polygon, {responseType: 'json'})
        .then((res) => {
            const {prev, next} = getPrevNext(res.data, dateFrom, dateTo, Store.current.dateFormat)
            let value = {
                prev,
                next,
                dates: res.data
            }

            if(isPrevNextOk(prev, next)) {
                Store.setAvailableDates(res.data)
                let key = keyify(url, polygon)
                setInCache(key, value)
                resolve(value)
                return
            }

            
            // search for prev/next further down the line +- maxExtent
            let p1 = Promise.resolve([]) // prev
            let p2 = Promise.resolve([]) // next

            if(thereShouldBePrev(dateFrom, minDate, dateFormat) && prev === null) {
                let _newFrom = moment(dateFrom, dateFormat).subtract(GLOB.maxExtent, 'days').format(dateFormat)
                let _newTo = moment(dateTo, dateFormat).subtract(GLOB.maxExtent, 'days').format(dateFormat)

                let _newNormalized = normalizeFromTo(dateFrom, dateTo, dateFormat, minDate, maxDate)
                _newFrom = _newNormalized['from'].format(dateFormat)
                _newTo = _newNormalized['to'].format(dateFormat)

                let _url = `${indexUrl}?timefrom=${_newFrom}&timeto=${_newTo}T23:59:59&maxcc=${cc / 100}`

                // cache
                p1 = new Promise((_resolve, _reject) => {
                    // cache
                    let key = keyify(url, polygon)
                    if(isInCache(key)) {
                        let val = getFromCache(key)
                        _resolve(val)
                        return
                    }

                    // actual request
                    request.post(_url, polygon, {responseType: 'json'})
                    .then(res => _resolve(res.data))
                })
            }

            if(thereShouldBeNext(dateTo, maxDate, dateFormat) && next === null) {
                let _newFrom = moment(dateFrom, dateFormat).add(GLOB.maxExtent, 'days').format(dateFormat)
                let _newTo = moment(dateTo, dateFormat).add(GLOB.maxExtent, 'days').format(dateFormat)

                let _newNormalized = normalizeFromTo(dateFrom, dateTo, dateFormat, minDate, maxDate)
                _newFrom = _newNormalized['from'].format(dateFormat)
                _newTo = _newNormalized['to'].format(dateFormat)

                let _url = `${indexUrl}?timefrom=${_newFrom}&timeto=${_newTo}T23:59:59&maxcc=${cc / 100}`
                // cache
                p2 = new Promise((_resolve, _reject) => {
                    // cache
                    let key = keyify(url, polygon)
                    if(isInCache(key)) {
                        let val = getFromCache(key)
                        _resolve(val)
                        return
                    }

                    // actual request
                    request.post(_url, polygon, {responseType: 'json'})
                    .then(res => _resolve(res.data))
                })
            }


            Promise.all([p1, p2])
            .then(values => {
                let dates = value.dates.concat(values[0], values[1])
                dates = _.uniq(dates)

                value.dates = dates

                let key = keyify(url, polygon)
                setInCache(key, value)
                resolve(value)
                return
            }).catch(e => {
                let key = keyify(url, polygon)
                setInCache(key, value)
                resolve(value)
                return    
            })
            
        })
        .catch(e => reject(e))
        // end of Request 1

    })
}

// util
function getPrevNext(dates, originalDateFrom, originalDateTo, dateFormat) {
    let unixDates = dates.map(value => moment(value, dateFormat).unix()*1000)
    let from = moment(originalDateFrom, dateFormat).unix()*1000
    let to = moment(originalDateTo, dateFormat).unix()*1000

    let prev = null
    let prevs = unixDates.filter(value => value < from).sort((a,b) => b-a)
    prevs.length > 0 ? prev = moment(prevs[0]).format(dateFormat) : ''
    
    let next = null
    let nexts = unixDates.filter(value => value > to).sort((a,b) => a-b)
    nexts.length > 0 ? next = moment(nexts[0]).format(dateFormat) : ''

    return { prev, next }
}

function isPrevNextOk(prev, next) {
    return prev !== null && next !== null
}

function getNewLimits(from, to, prev, next) {
    if(prev === null) from = Store.current.minDate
    if(next === null) to = moment().add(2, 'month').format(Store.current.dateFormat) // now + 2 months
    return { from, to }
}

export function getPrevNextByPoint(dates, timePoint, dateFormat) {
    let unixDates = dates.map(value => moment(value, dateFormat).unix()*1000)
    let time = moment(timePoint, dateFormat).unix()*1000

    let prev = null
    let prevs = unixDates.filter(value => value < time).sort((a,b) => b-a)
    prevs.length > 0 ? prev = moment(prevs[0]).format(dateFormat) : ''
    let next = null
    let nexts = unixDates.filter(value => value > time).sort((a,b) => a-b)
    nexts.length > 0 ? next = moment(nexts[0]).format(dateFormat) : ''
    return { prev, next }
}

function normalizeFromTo(from, to, format, min, max) {
    // find center
    let fromEpoch = moment(from, format).unix() * 1000 // ms
    let toEpoch = moment(to, format).unix() * 1000 // ms

    let centerEpoch = (fromEpoch + toEpoch) / 2
    centerEpoch = Math.floor(centerEpoch)

    let maxExtent = GLOB.maxExtent
    let halfOfMaxExtent = maxExtent / 2
    halfOfMaxExtent = Math.floor(halfOfMaxExtent)

    let extendedFrom_moment = moment(centerEpoch).subtract(halfOfMaxExtent, 'days')
    let extendedTo_moment = moment(centerEpoch).add(halfOfMaxExtent, 'days')
    let extendedFrom_formatted = extendedFrom_moment.format(format)
    let extendedTo_formatted = extendedTo_moment.format(format)
    let daysBeetweenFromTo = daysBeetween(extendedFrom_formatted, extendedTo_formatted, format)

    // days beetween min-max
    let daysBeetweenMinMax = daysBeetween(min, max, format)

    if(daysBeetweenMinMax < maxExtent) {
        return {
            from: moment(min, format),
            to: moment(max, format)
        }
    }

    let min_moment = moment(min, format)
    let max_moment = moment(max, format)
    let min_epoch = min_moment.unix() * 1000 // ms
    let max_epoch = max_moment.unix() * 1000 // ms
    let extendedFrom_epoch = extendedFrom_moment.unix() * 1000 // ms
    let extendedTo_epoch = extendedTo_moment.unix() * 1000 // ms

    // extended from-to might not be fully in bounds of min-max -> we shift it
    if(extendedFrom_epoch < min_epoch) {
        let _daysBeetween = daysBeetween(extendedFrom_moment, min_moment)

        let _extendedFrom_moment = extendedFrom_moment.add(_daysBeetween, 'days')
        let _extendedTo_moment = extendedTo_moment.add(_daysBeetween, 'days')

        return {
            from: _extendedFrom_moment,
            to: _extendedTo_moment
        }
    }

    if(extendedTo_epoch > max_epoch) {
        let _daysBeetween = daysBeetween(extendedTo_moment, max_moment)

        let _extendedFrom_moment = extendedFrom_moment.subtract(_daysBeetween, 'days')
        let _extendedTo_moment = extendedTo_moment.subtract(_daysBeetween, 'days')

        return {
            from: _extendedFrom_moment,
            to: _extendedTo_moment
        }
    }

    return {
        from: extendedFrom_moment,
        to: extendedTo_moment
    }
}

function daysBeetween(from, to, format) {
    let from_epoch = moment(from, format).unix() * 1000 // ms
    let to_epoch = moment(to, format).unix() * 1000 // ms

    let day = 1000 * 60 * 60 * 24 // ms

    let dt = Math.abs(to_epoch - from_epoch)

    let days = dt/day
    return Math.ceil(days)
}

function thereShouldBePrev(from, min, dateFormat) {
    let _from = moment(from, dateFormat).unix() * 1000 // ms
    let _min = moment(min, dateFormat).unix() * 1000 // ms

    return _from > _min
}

function thereShouldBeNext(next, max, dateFormat) {
    let _next = moment(next, dateFormat).unix() * 1000 // ms
    let _max = moment(max, dateFormat).unix() * 1000 // ms

    return _next < _max
}