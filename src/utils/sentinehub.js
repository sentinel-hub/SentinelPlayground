import {
  legacyGetMapFromParams,
  setAuthToken,
  ApiType,
  isAuthTokenSet
} from '@sentinel-hub/sentinelhub-js';
import Store from '../store';
import { isMultiTemporalDeploy } from '../utils/utils';

export class SentinelHub {
  constructor(baseUrlOldInstance, baseUrlNewInstance, recaptchaAuthToken) {
    this.baseUrlOldInstance = baseUrlOldInstance;
    this.baseUrlNewInstance = baseUrlNewInstance;
    setAuthToken(recaptchaAuthToken);
  }

  async getMapUsingWmsOldInstance(params) {
    return await legacyGetMapFromParams(this.baseUrlOldInstance, params);
  }

  async getMapUsingProcessingNewInstance(params) {
    return await legacyGetMapFromParams(this.baseUrlNewInstance, params, ApiType.PROCESSING);
  }

  async getMap(paramsOriginal) {
    let params = {};
    Object.keys(paramsOriginal).forEach(k => {
      params[k.toLowerCase()] = paramsOriginal[k];
    });
    if (!params['preview']) {
      params['preview'] = 2; // this setting allows zoomed-out previews on Processing API, otherwise we get bounds-too-big errors (this parameter was set directly on layers for the old instances)
    }
    if (!params['bgcolor']) {
      params['bgcolor'] = '000000'; // WMS allows setting bgcolor, while Processing API doesn't; since the default for Processing is black, we set it in WMS to black too
    }

    /*
      2 options:
      - use WMS with old instance ID (for old layer definitions, when users change just gain + gamma, and
        for custom layer which uses scripts version 1 or 2)
      - use Processing API (for normal layers and for VERSION=3 custom evalscripts)
    */

    if (!isAuthTokenSet() || this.baseUrlNewInstance === undefined) {
      // no choice, we need to use WMS with old instance ID:
      return await this.getMapUsingWmsOldInstance(params);
    }

    // Special use case (of course) - if this app updated the Store.current.datasources to include a datasource
    // which is marked with `private: true`, then the user must have pressed "Open in Playground" button in
    // Configurator. In this case we use the old WMS, because their scripts are probably not version 3 and
    // because we probably don't have access to the user instances through Processing API.
    const privateDatasource = Store.current.datasources.find(ds => ds.private);
    if (privateDatasource) {
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (params.atmfilter || params.layers.endsWith(',DATE')) {
      // "show acquisition dates" is only supported on WMS with old instance ID:
      // (because we need WMS, and it needs the layer definitions, which should then be VERSION 1 or 2)
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (params.evalscripturl) {
      // if evalscripturl is used, we have no idea what version the evalscript is - we just assume
      // it will be WMS:
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (isMultiTemporalDeploy() && !!params.temporal) {
      //if multitemporal mode is enabled and "enable temporal data" is on, wms will be used.
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (params.evalscript && params.evalsource) {
      const decodedEvalscript = atob(params.evalscript);
      if (decodedEvalscript.startsWith('//VERSION=3')) {
        // the evalscript we have is marked as VERSION 3 - both Processing API and WMS support this,
        // but we prefer Processing API:
        return await this.getMapUsingProcessingNewInstance(params);
      } else {
        // otherwise we try to use the old instance via WMS:
        return await this.getMapUsingWmsOldInstance(params);
      }
    }

    // by default, use the Processing API:
    return await this.getMapUsingProcessingNewInstance(params);
  }

  updateToken(recaptchaAuthToken) {
    setAuthToken(recaptchaAuthToken);
  }
}
