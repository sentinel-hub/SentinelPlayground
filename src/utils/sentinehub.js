import { SentinelHubWms, SentinelHubProcessing } from 'sentinelhub-js';
import Store from '../store';

export class SentinelHub {
  constructor(baseUrlOldInstance, baseUrlNewInstance, recaptchaAuthToken) {
    this.baseUrlOldInstance = baseUrlOldInstance;
    this.baseUrlNewInstance = baseUrlNewInstance;
    this.recaptchaAuthToken = recaptchaAuthToken;
  }

  async getMapUsingWmsOldInstance(params) {
    const sh = new SentinelHubWms(this.baseUrlOldInstance);
    return await sh.getMap(params);
  }

  async getMapUsingWmsNewInstance(params) {
    const sh = new SentinelHubWms(this.baseUrlNewInstance);
    return await sh.getMap(params);
  }

  async getMapUsingProcessingNewInstance(params) {
    const urlParts = this.baseUrlNewInstance.split('/');
    const instanceId = urlParts[urlParts.length - 1];
    const sh = new SentinelHubProcessing(instanceId, this.recaptchaAuthToken);
    const adaptedParams = {
      ...params
      // crs: undefined // what we really should do here is translate old CRS strings to new ones (when we get the docs, that is)
    };
    return await sh.getMap(adaptedParams);
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
      3 options:
      - use WMS with old instance ID (for old layer definitions, when users change just gain + gamma)
      - use WMS with new instance ID (for custom layer, which uses scripts version 1 and 2)
      - use Processing API (for normal layers and for VERSION=3 custom evalscripts)
    */

    // We wish to deploy new API gradually, so that we can detect any performance issues in time. This
    // constant lets us determine what part of requests are even considered for new API:
    const PROBABILITY_TO_CONSIDER_NEW_API = 1.0; // from 0.0 to 1.0
    if (Math.random() >= PROBABILITY_TO_CONSIDER_NEW_API) {
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (this.recaptchaAuthToken === undefined || this.baseUrlNewInstance === undefined) {
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

    if (
      (params.gamma && Number(params.gamma).toFixed(1) !== '1.0') ||
      (params.gain && Number(params.gain).toFixed(1) !== '1.0') ||
      params.atmfilter ||
      params.layers.endsWith(',DATE')
    ) {
      // gain, gamma, atmfilter and "show acquisition dates" are only supported on WMS with old instance ID:
      // (because we need WMS, and it needs the layer definitions, which should then be VERSION 1 or 2)
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (params.evalscripturl) {
      // if evalscripturl is used, we have no idea what version the evalscript is - we just assume
      // it will be WMS:
      return await this.getMapUsingWmsOldInstance(params);
    }
    if (params.evalscript && params.evalsource) {
      const decodedEvalscript = atob(params.evalscript);
      if (decodedEvalscript.startsWith('//VERSION=3')) {
        // the evalscript we have is marked as VERSION 3 - only Processing API supports this:
        const adaptedParams = {
          ...params,
          evalscript: decodedEvalscript
        };
        return await this.getMapUsingProcessingNewInstance(adaptedParams);
      } else {
        // otherwise we try to use the new instance, even though we are using WMS. We could use the old
        // instance here too, but... where's fun in that? ;)
        return await this.getMapUsingWmsNewInstance(params);
      }
    }

    // by default, use the Processing API:
    return await this.getMapUsingProcessingNewInstance(params);
  }

  updateToken(token) {
    this.recaptchaAuthToken = token;
  }
}
