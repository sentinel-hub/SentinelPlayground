import request from 'axios'
import axios from 'axios'
import Store from '../store'
import moment from 'moment'
import _ from 'lodash'

const GLOB = {}
GLOB.maxExtent = 88 // from-to has 3 months limit, DB optimization - in days

const dsCache = {}

export function loadGetCapabilities(ds = null, firstLoad = false) {
  const { datasources, preset, dateFormat } = Store.current
  const { url, minDate, maxDate = moment(), id: datasetId } = ds
  const existing = dsCache[datasetId]
  if (existing) {
    const { channels, presets, preset } = existing
    Store.setChannels(channels)
    if (ds !== null) {
      Store.setPreset(preset)
      Store.setDatasource(ds)
    }
    Store.setPresets(presets)
    return Promise.resolve()
  }
  const capabilitiesUrl = `${url}?SERVICE=WMS&REQUEST=GetCapabilities`
  return new Promise((resolve, reject) => {
    var parseString = require('xml2js').parseString
    request
      .get(`${capabilitiesUrl}&time=${new Date().valueOf()}`, {
        //we add time parameter so caching is prevented
        responseType: 'text'
      })
      .then(res => {
        parseString(res.data, (err, result) => {
          let instanceName = result.WMS_Capabilities.Service[0].Title[0]
          let layers = result.WMS_Capabilities.Capability[0].Layer[0].Layer
          var myRegexp = /^B[0-9][0-9A]/i //excluse "B01", "B8A" etc. layer names
          let preset = null,
            channels = []
          let presets = { ...Store.current.customPreset }
          for (let l in layers) {
            if (layers.hasOwnProperty(l)) {
              var layerName = layers[l].Name[0]
              const splitName = layerName.split('.')[1]
              if (layerName === 'FILL' || splitName === 'FILL') break
              if (!myRegexp.test(layerName)) {
                let desc = layers[l].Abstract ? layers[l].Abstract[0] : ''
                if (!preset) {
                  preset = layerName //set first layer as default selection
                }
                let legendUrl = getLegendUrl(layers[l])

                presets[layerName] = {
                  name: layers[l].Title[0],
                  desc: desc,
                  image: `${url}?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&LAYERS=${layerName}&BBOX=12697069,2555251,12708076,2563048&MAXCC=20&WIDTH=80&HEIGHT=80&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=${moment(
                    maxDate
                  )
                    .subtract(1, 'years')
                    .format(dateFormat)}/${moment(maxDate).format(dateFormat)}`
                }
                if (legendUrl) {
                  presets[layerName].legendUrl = legendUrl
                }
              } else {
                //fill bands
                let desc = layers[l].Abstract !== undefined ? layers[l].Abstract[0] : ''
                let detailDesc = desc.indexOf('|') !== -1 ? layers[l].Abstract[0].split('|')[0] : desc
                let color = desc.indexOf('|') !== -1 ? layers[l].Abstract[0].split('|')[1] : 'red'
                channels.push({
                  name: layerName,
                  desc: detailDesc,
                  color: color
                })
              }
            }
          }
          dsCache[datasetId] = { channels, presets, preset }
          Store.setChannels(channels)
          Store.setPresets(presets)
          if (ds.private) {
              ds.name = instanceName
              Store.current.datasources.push(ds)
          }
          if ((ds !== null || Store.current.preset === null) && !firstLoad) {
            Store.setPreset(preset)
            ds && Store.setDatasource(ds)
          }
          if (!window.location.href.includes('preset') && Store.current.preset === null) {
            Store.setPreset(preset)
          }
          resolve()
        })
      })
      .catch(e => reject(e))
  })
}

function getLegendUrl(layer) {
  let urlCandidate

  try {
    layer.Style.forEach(value => {
      if (value.Name[0] === 'COLOR_MAP') {
        urlCandidate = value.LegendURL[0].OnlineResource[0].$['xlink:href']
      }
    })
  } catch (ex) {}

  return urlCandidate
}

// cache stuff
const cache = {}
window.cache = cache

export function getPrevNextByPoint(dates, timePoint, dateFormat) {
  let unixDates = dates.map(value => moment(value, dateFormat).unix() * 1000)
  let time = moment(timePoint, dateFormat).unix() * 1000

  let prev = null
  let prevs = unixDates.filter(value => value < time).sort((a, b) => b - a)
  prevs.length > 0 ? (prev = moment(prevs[0]).format(dateFormat)) : ''
  let next = null
  let nexts = unixDates.filter(value => value > time).sort((a, b) => a - b)
  nexts.length > 0 ? (next = moment(nexts[0]).format(dateFormat)) : ''
  return { prev, next }
}
