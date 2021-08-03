import { initState } from './state'
import { initEvents } from './events'
import { callHook, mountComponent, initLifecycle } from "./lifecycle"
import { compileToFunction } from "./compiler/index";
import { mergeOptions } from './utils'
import { initInjections, initProvide } from './inject'
import { initRender } from './render'

let uid = 0

export function initMixin(Vue) {
  // console.log('initMixin----')
  Vue.prototype._init = function(options) {
    const vm = this
    vm._uid = uid++
    if (options && options._isComponent) {
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(vm.constructor.options, options)
    }


    // console.log('init---vm.$options---', vm.$options)
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    // debugger
    initInjections(vm)
    initState(vm)
    initProvide(vm)
    callHook(vm, 'created')

    if (vm.$options.el) {
      // debugger
      vm.$mount(vm.$options.el)
    }
  }

  Vue.prototype.$mount = function (el) {
    // console.log('$mount----el---', el)
    const vm = this
    const options = vm.$options
    el = document.querySelector(el)
    vm.$el = el
    if (!options.render) {
      let template = options.template
      if (!template && el) {
        template = el.outerHTML
        // console.log('template---', template)
      }
      let render = compileToFunction(template)
      options.render = render
    }
    // debugger
    mountComponent(vm, el)
  }
}

export function initInternalComponent(vm, options) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // debugger
  // console.log('vm---', vm, options)
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode
  const vnodeComponentOptions = parentVnode.componentOptions
  opts._renderChildren = vnodeComponentOptions.children
}