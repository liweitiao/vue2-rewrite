
import { installRenderHelpers, resolveSlots } from './render-helpers'


export function initRender(vm) {
  vm._vnode = null
  // debugger
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode
  // const renderContext = parentVnode && parentVnode.context
  // change...FIXME...
  const renderContext = vm && vm.$parent
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
}


export function renderMixin(Vue) {
  // console.log('renderMixin---')
 installRenderHelpers(Vue.prototype)

  Vue.prototype._render = function () {
    const vm = this
    const { render, _parentVnode } = vm.$options
    vm.$vnode = _parentVnode
    let vnode = render.call(vm)
    vnode.parent = _parentVnode
    
    return vnode
  }
}