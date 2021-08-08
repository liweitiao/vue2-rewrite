
import { installRenderHelpers, resolveSlots } from './render-helpers'
import { createElement } from './vdom/create-element'


export function initRender(vm) {
  vm._vnode = null
  // debugger
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode
  // const renderContext = parentVnode && parentVnode.context
  // change...FIXME...
  const renderContext = vm && vm.$parent
  vm.$slots = resolveSlots(options._renderChildren, renderContext)

  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d)
}

export let currentRenderingInstance = null

export function renderMixin(Vue) {
  // console.log('renderMixin---')
 installRenderHelpers(Vue.prototype)

  Vue.prototype._render = function () {
    const vm = this
    const { render, _parentVnode } = vm.$options
    vm.$vnode = _parentVnode
    console.log('render---', render.toString())
    debugger
    currentRenderingInstance = vm
    let vnode = render.call(vm._renderProxy, vm.$createElement)
    vnode.parent = _parentVnode

    return vnode
  }
}