import proj4 from 'proj4'

export function wgs84ToMercator(point) {
    var sourceCRS = proj4.Proj('EPSG:4326');
    var destCRS = proj4.Proj('EPSG:3857');
    var pt = new proj4.toPoint([point[1], point[0]]);
    proj4.transform(sourceCRS, destCRS, pt);
    return pt;
}
export function calcBboxFromXY(point, zoomLevel) {
    let xy = wgs84ToMercator(point)
    var scale = 40075016 / (512 * Math.pow(2, (zoomLevel - 1)));
    let arr = [];
    let imgH = window.innerHeight - 100
    let imgW = window.innerWidth - 100
    arr.push(Math.floor(xy.x - 0.5 * imgW * scale));
    arr.push(Math.floor(xy.y - 0.5 * imgH * scale));
    arr.push(Math.floor(xy.x + 0.5 * imgW * scale));
    arr.push(Math.floor(xy.y + 0.5 * imgH * scale));
    return arr;
}