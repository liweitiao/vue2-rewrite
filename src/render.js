
import { installRenderHelpers } from './render-helpers'

export function renderMixin(Vue) {
  // console.log('renderMixin---')
 installRenderHelpers(Vue.prototype)

  Vue.prototype._render = function () {
    const vm = this
    let render = vm.$options.render
    let vnode = render.call(vm)
    return vnode
  }
}