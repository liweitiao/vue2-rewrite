import { patch } from "./vdom/patch";
import Watcher from './observer/watcher'
import { nextTick } from "./utils";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    // debugger
    const prevEl = vm.$el // previously 先前
    const prevVnode = vm._vnode
    vm._vnode = vnode
    // debugger
    if (!prevVnode) {
      vm.$el = patch(vm.$el, vnode)
    } else {
      vm.$el = patch(prevVnode, vnode)
    }
  }
  Vue.prototype.$nextTick = nextTick

  Vue.prototype.$forceUpdate = function () {
    // debugger
    const vm = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }
}

export function initLifecycle(vm) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
          parent = parent.$parent
      }
      parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function mountComponent(vm, el) {
  let updateComponent = () => {
    let vnode = vm._render()
    // console.log('lifecycle----mountComponent----vnode----', vnode)
    // debugger
    vm._update(vnode)
  }

  callHook(vm, 'beforeMount')
  new Watcher(vm, updateComponent, () => {
    console.log('视图更新了！')
  }, true)
  // updateComponent()
  callHook(vm, 'mounted')
}

export function callHook(vm,hook){
  let handlers = vm.$options[hook];
  if(handlers){
      for(let i =0; i < handlers.length;i++){
          handlers[i].call(vm)
      }
  }
}