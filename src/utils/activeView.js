import Store from '../store';
import {getMultipliedLayers} from './utils';

export function whichVisualizationDoISee() {
    const {preset, views, layers, renderedEvalscript} = Store.current

    if(preset !== 'CUSTOM') {
        return views.PRESETS
    }

    if(renderedEvalscript !== '') {
        return views.SCRIPT
    }

    return views.BANDS
}

export function isRgbNull() {
    const {layers} = Store.current

    return layers.r === 'NULL' || layers.g === 'NULL' || layers.b === 'NULL'
}

