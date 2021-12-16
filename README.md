Sentinel Playground has been made open-source to provide an easier way of trying the Sentinel Hub WMS services.
Project is built with [React](https://facebook.github.io/react/), more specifically with [Create React App](https://github.com/facebookincubator/create-react-app).
For state management it uses [Redux](https://github.com/reactjs/redux). Map is based on [Leaflet](http://leafletjs.com/).

<img src='http://www.sentinel-hub.com/sites/default/files/sentinel-2_viewer_animation_3.gif' alt='Sentinel Playground' />

## Setting up

Node.js version 8.x must be used to run app successfully.

```
- yarn install
- open src/store/config.js and insert your Sentinel API key
- yarn start (for local testing)
- yarn build (prepare application for deploy)
```

## Acquiring Sentinel API key

To use Sentinel WMS service, you need to have your API key. You can get test API key by writing mail to [info@sentinel-hub.com](mailto:info@sentinel-hub.com).
For more info about WMS service, check [www.sentinel-hub.com/apps/wms](http://www.sentinel-hub.com/apps/wms).

