import { mergeOptions, isPlainObject } from '../utils'

export function initGlobalApi(Vue) {
  Vue.cid = 0
  let cid = 1
  
  Vue.options = {}
  Vue.mixin = function(options) {
    this.options = mergeOptions(this.options, options)
    // console.log('initGlobal-----options----', this.options)
    return this
  }

  Vue.options._base = Vue
  Vue.options.components = {}
  Vue.component = function (id, definition) {
    if (isPlainObject(definition)) {
      definition = this.options._base.extend(definition)
    }
    // console.log('global-api----component---definition---', definition)
    this.options.components[id] = definition
  }

  Vue.extend = function (opts) {
    const Super = this
    const Sub = function VueComponent(options) {
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(Super.options, opts)
    // console.log('global-api----extend----Sub.options---', Sub.options)
    return Sub
  }
}