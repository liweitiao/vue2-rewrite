import { isFunction, noop } from './utils'
import { observe } from './observer/index'
import Watcher from "./observer/watcher";
import Dep from './observer/dep'

export function stateMixin(Vue) {
  Vue.prototype.$watch = function (key, handler, options = {}) {
    options.user = true
    // console.log('state---$watch---this---', this)
    new Watcher(this, key, handler, options)
  }
}


export function initState(vm) {
  const opts = vm.$options
  // console.log('state----opts---', opts)
  if (opts.data) {
    initData(vm)
  }
  if (opts.methods) {
    initMethods(vm, opts.methods)
  }
  if (opts.watch) {
    initWatch(vm, opts.watch)
  }
  if (opts.computed) {
    initComputed(vm, opts.computed)
  }
}

function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key]
    },
    set(newValue) {
      vm[source][key] = newValue
    }
  })
}


function initData(vm) {
  let data = vm.$options.data
  data = vm._data = isFunction(data) ? data.call(vm) : data

  for (let key in data) {
    proxy(vm, '_data', key)
  }

  observe(data)
}

function initMethods(vm, methods) {
  // console.log('initMethods---vm---methods---', vm, methods)
  for (const key in methods) {
    vm[key] = typeof methods[key] !== 'function' ? noop : methods[key].bind(vm)
  }
}

function initWatch(vm, watch) {
  for (let key in watch) {
    let handler = watch[key]
    // console.log('state---handler----', handler)
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher(vm, key, handler) {
  return vm.$watch(key, handler)
}

function initComputed(vm, computed) {
  const watchers = vm._computedWatchers = {}
  for (let key in computed) {
    const userDef = computed[key]
    let getter = typeof userDef == 'function' ? userDef : userDef.get

    watchers[key] = new Watcher(vm, getter, () => {}, { lazy: true })

    defineComputed(vm, key, userDef)
  }
}

function createComputedGetter(key) {
  // console.log('createComputed---')
  return function computedGetter() {
    let watcher = this._computedWatchers[key]
    // console.log('state----createComputedGetter-key--watcher---',key, watcher)
    if (watcher.dirty) {
      watcher.evaluate()
    }

    // console.log('state----createComputed----Dep.target---', Dep.target)
    if (Dep.target) {
      watcher.depend()
    }
    return watcher.value
  }
  
}

function defineComputed(vm, key, userDef) {
  let sharedProperty = {}
  if (typeof userDef == 'function') {
    sharedProperty.get = userDef
  } else {
    // sharedProperty.get = userDef.get
    sharedProperty.get = createComputedGetter(key)
    // sharedProperty.get()
    sharedProperty.set = userDef.set
  }
  Object.defineProperty(vm, key, sharedProperty)
}