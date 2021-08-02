import { createElement, createTextElement } from "./vdom/index"

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
}