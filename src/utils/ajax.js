import axios from 'axios';
import Store from '../store';
import { SentinelHubWms } from 'sentinelhub-js';
import _ from 'lodash';
import { getMultipliedLayers } from './utils';
import bands from './bands.json';
import availablePreviews from '../previews.json';

const GLOB = {};
GLOB.maxExtent = 88; // from-to has 3 months limit, DB optimization - in days

const dsCache = {};

export function loadGetCapabilities(ds, firstLoad = false) {
  const { preset, activeDatasource } = Store.current;
  const { url, id: datasetId, name, datasourceID } = ds || activeDatasource;
  const existing = dsCache[datasetId];
  const isJsonResponse = url.includes('ogc') || url.includes('services.sentinel-hub.com');
  if (existing) {
    const { channels, presets } = existing;
    Store.setChannels(channels, presets);
    if (ds !== null) {
      Store.setPreset(presets[0].id);
      Store.setDatasource(ds);
    }
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    var parseString = require('xml2js').parseString;
    new SentinelHubWms(url, datasourceID)
      .getCapabilities({ format: isJsonResponse ? 'application/json' : 'text/xml' })
      .then(res => {
        if (isJsonResponse) {
          const { layers, datasets } = res;
          let channels = [];
          const presets = [];
          layers.forEach(layer => {
            const standardRegexp = /^B[0-9][0-9A]/i;
            if (standardRegexp.test(layer.id)) {
              const { description } = layer;
              const [desc, color] = description.split('|');
              channels.push({ ...layer, desc, color });
            } else {
              // for the known layers we have preview images available in /public/previews/, but we must also
              // be able to display previews for user-defined ("Open in Playground") layers:
              const [ , instanceId ] = url.split('/ogc/wms/');
              const shortInstanceId = instanceId.substring(0, 8);
              const jpegFileName = `${shortInstanceId}-${layer.id}.jpeg`;
              let imageUrl;
              if (availablePreviews.find(p => p === jpegFileName)) {
                imageUrl = `previews/${jpegFileName}`;
              } else {
                // user defined layer:
                const bbox = '15,45.95347718,15.03818374,45.98047579';
                const crs = 'CRS:84';
                imageUrl = `${url}?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=${layer.id}&BBOX=${bbox}&CRS=${crs}&MAXCC=100&WIDTH=50&HEIGHT=50&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2019-01-01/2019-07-01`;
              }
              presets.push({
                ...layer,
                image: imageUrl,
              });
          }
          });
          if (channels.length === 0) {
            channels = datasets[0].name.includes('S2')
              ? bands.S2
              : datasets[0].bands.map(b => ({ name: b }));
          }
          Store.setChannels(channels, presets);
          const defaultPreset = presets[0].id;
          Store.setEvalScript(btoa('return [' + getMultipliedLayers(Store.current.layers) + ']'));
          dsCache[datasetId] = { channels, presets, preset };
          if (ds.private) {
            ds.name = name;
            Store.current.datasources.push(ds);
          }
          if ((ds !== null || !Store.current.preset) && !firstLoad) {
            Store.setPreset(defaultPreset);
            ds && Store.setDatasource(ds);
          }
          if (!window.location.href.includes('preset') && Store.current.preset === null) {
            Store.setPreset(defaultPreset);
          }
          resolve(res.data);
          return;
        }

        // NOTE: (as far as I'm aware) we don't use XML parsing at all, so this code could probably be removed:
        parseString(res.data, (err, result) => {
          let instanceName = result.WMS_Capabilities.Service[0].Title[0];
          let layers = result.WMS_Capabilities.Capability[0].Layer[0].Layer;
          var myRegexp = /^B[0-9][0-9A]/i; //excluse "B01", "B8A" etc. layer names
          let preset = null,
            channels = [];
          let presets = [];
          for (let l in layers) {
            if (layers.hasOwnProperty(l)) {
              var layerName = layers[l].Name[0];
              const splitName = layerName.split('.')[1];
              if (layerName === 'FILL' || splitName === 'FILL') break;
              if (!myRegexp.test(layerName)) {
                let desc = layers[l].Abstract ? layers[l].Abstract[0] : '';
                if (!preset) {
                  preset = layerName; //set first layer as default selection
                }
                let legendUrl = getLegendUrl(layers[l]);

                presets.push({
                  id: layerName,
                  name: layers[l].Title[0],
                  desc: desc,
                  legendUrl: legendUrl,
                  image: '/nopreview.jpeg',
                });
              } else {
                //fill bands
                let desc = layers[l].Abstract !== undefined ? layers[l].Abstract[0] : '';
                let detailDesc =
                  desc.indexOf('|') !== -1 ? layers[l].Abstract[0].split('|')[0] : desc;
                let color = desc.indexOf('|') !== -1 ? layers[l].Abstract[0].split('|')[1] : 'red';
                channels.push({
                  name: layerName,
                  desc: detailDesc,
                  color: color
                });
              }
            }
          }
          dsCache[datasetId] = { channels, presets, preset };
          Store.setChannels(channels, presets);
          if (ds.private) {
            ds.name = instanceName;
            Store.current.datasources.push(ds);
          }
          if ((ds !== null || Store.current.preset === null) && !firstLoad) {
            Store.setPreset(preset);
            ds && Store.setDatasource(ds);
          }
          if (!window.location.href.includes('preset') && Store.current.preset === null) {
            Store.setPreset(preset);
          }
          resolve();
        });
      })
      .catch(e => reject(e));
  });
}

function getLegendUrl(layer) {
  let urlCandidate;

  try {
    layer.Style.forEach(value => {
      if (value.Name[0] === 'COLOR_MAP') {
        urlCandidate = value.LegendURL[0].OnlineResource[0].$['xlink:href'];
      }
    });
  } catch (ex) {}

  return urlCandidate;
}

// URL shortner - Google
export function shortenUrl(longUrl) {
  const url = `https://www.googleapis.com/urlshortener/v1/url?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;

  let instance = axios.create({
    headers: { 'Content-Type': 'application/json' }
  });

  return instance.post(url, {
    longUrl: longUrl
  });
}
