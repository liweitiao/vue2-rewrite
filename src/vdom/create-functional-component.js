import { hasOwn } from "../utils";
import { createComponent } from "./create-component";
import VNode from "./vnode";
import { createElement } from "./create-element";

function FunctionalRenderContext(data, children, parent, Ctor) {

  // debugger
  const options = Ctor.options
  let contextVm
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent)
    contextVm._original = parent
  } else {
    contextVm = parent
    parent = parent._original
  }

  this.data = data
  this.children = children
  this.parent = parent
  this._c = (a, b, c, d) => createElement(contextVm, a, b, c, d)
}

export function createFunctionalComponent(Ctor, data, contextVm, children) {
  // debugger
  const options = Ctor.options

  const renderContext = new FunctionalRenderContext(data, children, contextVm, Ctor)
  // debugger
  const vnode = options.render.call(null, renderContext._c, renderContext)
  // debugger
  if (vnode instanceof VNode) {
    return vnode
  }
}