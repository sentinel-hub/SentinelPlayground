export class CacheMasterSupreme {
    constructor(payloadFunc = undefined) {
        this.payloadFunc = payloadFunc
        this.cache = {}
    }

    makeKey(payload) {
        if(this.payloadFunc === undefined) return JSON.stringify(payload)

        return this.payloadFunc(payload)
    }

    getCache() {
        return this.cache
    }

    isIn(payload) {
        let key = this.makeKey(payload)

        return this.cache[key] !== undefined
    }

    set(payload, value) {
        let key = this.makeKey(payload)

        this.cache[key] = value
    }

    get(payload) {
        let key = this.makeKey(payload)

        return this.cache[key]
    }
}