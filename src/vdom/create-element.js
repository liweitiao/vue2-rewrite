import VNode from './vnode'
import { createComponent } from './create-component'
import { isReservedTag, isObject } from "../utils"

export function createElement (context, tag, data = {}, ...children) {
  // TODO...

  return _createElement(context, tag, data, children)
}

export function _createElement(context, tag, data, children) {
  let vnode
  if (isReservedTag(tag)) {
    vnode = new VNode(context, tag, data, data.key, children, undefined)
  } else {
    const Ctor = context.$options.components[tag]
    return createComponent(context, tag, data, data.key, children, Ctor)
  }
  
  return vnode
}

export function createTextElement(context, text) {
  return new VNode(context, undefined, undefined, undefined, undefined, text)
}