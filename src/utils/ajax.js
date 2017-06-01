import request from 'superagent';
import xml2jsParser from 'superagent-xml2jsparser';
import Store from '../store'

export function loadGetCapabilities() {
    return new Promise((resolve, reject) => {
        var parseString = require('xml2js').parseString;
        request.get(Store.current.capabilitiesUrl)
            .accept('xml')
            .parse(xml2jsParser)
            .end((err, res) => {
                if (res === undefined) {
                    window.location.reload()
                }
                if (res.ok) {
                    parseString(res.text, function (err, result) {
                        if (result) {
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
                                        presets[layerName] = {
                                            name:  layers[l].Title[0],
                                            desc:  desc,
                                            image: `${Store.current.baseImgWmsUrl}&SHOWLOGO=false&LAYERS=${layerName}&BBOX=-19482,6718451,-18718,6719216&MAXCC=20&WIDTH=40&HEIGHT=40&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2016-08-04`
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
                        } else {
                            reject(err)
                        }
                    });
                } else {
                    window.location.reload()
                }
            })
    })
}


export function queryAvailableDates(bounds) {
    return new Promise((resolve, reject) => {
        var coords = [];
        let sw = bounds.getSouthWest(),
              se = bounds.getSouthEast(),
              ne = bounds.getNorthEast(),
              nw = bounds.getNorthWest()
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
        let toDate = Store.current.maxDate.format(Store.current.dateFormat)
        var url = `${Store.current.baseIndexUrl}/index/v1/finddates?timefrom=${Store.current.minDate}&timeto=${toDate}&maxcc=${Store.current.maxcc / 100}`
        request.post(url)
            .set('Content-Type', 'application/json')
            .type('json')
            .send(polygon)
            .end((err, res) => {
                if (res.ok) {
                    Store.setAvailableDates(JSON.parse(res.text));
                    resolve()
                } else {
                    reject(err)
                }
            })
    })
}
