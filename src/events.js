/* @flow */

// import {
//   tip,
//   toArray,
//   hyphenate,
//   formatComponentName,
//   invokeWithErrorHandling
// } from '../util/index'
// import { updateListeners } from '../vdom/helpers/index'
import { toArray } from './utils'


export function initEvents (vm) {
  vm._events = Object.create(null)
}

let target

function add (event, fn) {
  target.$on(event, fn)
}

function remove (event, fn) {
  target.$off(event, fn)
}

export function eventsMixin (Vue) {
  const hookRE = /^hook:/
  Vue.prototype.$on = function (event, fn) {
    console.log('$on----')
    const vm = this
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn)
    }
    return vm
  }

  Vue.prototype.$once = function (event, fn) {
    const vm = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

  Vue.prototype.$off = function (event, fn) {
    const vm = this
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // specific handler
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  Vue.prototype.$emit = function (event) {
    console.log('$emit----')
    const vm = this
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
        // invokeWithErrorHandling(cbs[i], vm, args, vm, info)
        cbs[i].call(vm)
      }
    }
    return vm
  }
}
