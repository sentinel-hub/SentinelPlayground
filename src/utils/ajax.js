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
                                    if (layerName === "FILL") {
                                        break
                                    }
                                    if (!preset) {
                                        preset = layerName; //set first layer as default selection
                                    }
                                    if (!myRegexp.test(layerName)) {
                                        presets[layerName] = {
                                            name:  layers[l].Title[0],
                                            desc:  layers[l].Abstract[0],
                                            image: `${Store.current.baseImgWmsUrl}&SHOWLOGO=false&LAYERS=${layerName}&BBOX=-19482,6718451,-18718,6719216&MAXCC=20&WIDTH=40&HEIGHT=40&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2016-08-04`
                                        }
                                    } else {
                                        //fill bands
                                        channels.push({
                                            name: layerName,
                                            desc: layers[l].Abstract[0].split("|")[0],
                                            color: (layers[l].Abstract[0].split("|")[1] !== undefined) ? layers[l].Abstract[0].split("|")[1] : "red"
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
                }
            })
    })
}


export function queryAvailableDates(bounds) {
    return new Promise((resolve, reject) => {
        let ne = (bounds._northEast)
        let sw = (bounds._southWest)
        let minX = parseFloat(sw.lng);
        let minY = parseFloat(sw.lat);
        let maxX = parseFloat(ne.lng);
        let maxY = parseFloat(ne.lat);
        var coords = [];
        coords.push([minX, minY]);
        coords.push([maxX, minY]);
        coords.push([maxX, maxY]);
        coords.push([minX, maxY]);
        coords.push([minX, minY]);
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