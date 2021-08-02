import { patch } from "./vdom/patch";
import Watcher from './observer/watcher'
import { nextTick } from "./utils";

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    // debugger
    vm.$el = patch(vm.$el, vnode)
  }
  Vue.prototype.$nextTick = nextTick
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
    console.log('lifecycle----mountComponent----vnode----', vnode)
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