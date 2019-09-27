import axios from 'axios';
import config from './src/store/config';

const fs = require('fs');

async function updatePreviews(previewsDir, previewsIndexFile) {
  // remove old previews:
  for (let fileName of fs.readdirSync(previewsDir)) {
    fs.unlinkSync(`${previewsDir}/${fileName}`);
  }

  // fetch new previews:
  const datasources = config.datasources;
  let previews = [];
  for (let ds of datasources) {
    const [servicesRootUrl, instanceId] = ds.url.split('/ogc/wms/');
    const shortInstanceId = instanceId.substring(0, 8);
    const getCapabilitiesUrl = `${servicesRootUrl}/ogc/wms/${instanceId}?request=GetCapabilities&format=application%2Fjson`;
    const capabilities = await axios.get(getCapabilitiesUrl);
    for (let layer of capabilities.data.layers) {
      const bbox = '15,45.95347718,15.03818374,45.98047579';
      const crs = 'CRS:84';
      const previewUrl = `${servicesRootUrl}/ogc/wms/${instanceId}?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=${
        layer.id
      }&BBOX=${bbox}&CRS=${crs}&MAXCC=100&WIDTH=50&HEIGHT=50&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2019-01-01/2019-07-01`;
      const fileName = `${shortInstanceId}-${layer.id}.jpeg`;
      const fullFileName = `${previewsDir}/${fileName}`;
      const thumbnail = await axios.get(previewUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(fullFileName, thumbnail.data);
      previews.push(fileName);
    }
  }

  // write an index file so we know (in Playground app) which files exist:
  fs.writeFileSync(previewsIndexFile, JSON.stringify(previews, null, 2));
}

updatePreviews('./public/previews', './src/previews.json')
  .then(() => console.log('DONE.'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
