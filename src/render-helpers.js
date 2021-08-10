// import { createElement, createTextElement } from "./vdom/index"
import { createElement, createTextElement } from './vdom/create-element'
import { createEmptyVNode } from './vdom/vnode';

export function installRenderHelpers (target) {
  target._c = function() {
    return createElement(this, ...arguments)
  }

  target._v = function (text) {
    return createTextElement(this, text)
  }

  target._s = function(val) {
    if (typeof val === 'object') return JSON.stringify(val)
    return val
  }

  target._t = function(name) {
    let nodes
    // debugger
    nodes = this.$slots[name]
    return nodes
  }

  target._e = function(name) {
    return createEmptyVNode(name)
  }
}

export function resolveSlots(children, context) {
  if (!children || !children.length) {
    return {}
  }
  // debugger
  const slots = {}
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    const data = child ? child.data : {}
    // if (data && data.slot) {
    //   delete data.slot
    // }

    if (data && data.slot != null) {
      const name = data.slot
      const slot = (slots[name] || (slots[name] = []))
      slot.push(child)
    } else {
      (slots.default || (slots.default = [])).push(child)
    }
  }

  return slots
}