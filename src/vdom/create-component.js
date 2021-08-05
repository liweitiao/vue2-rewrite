import {  isObject } from "../utils"
import VNode from "./vnode";

export function createComponent(context, tag, data, key, children, Ctor) {
  const baseCtor = context.$options._base
  if (isObject(Ctor)) {
    Ctor = baseCtor.exend(Ctor)
  }
  data.hook = {
    init(vnode) {
      let child = vnode.componentInstance = new Ctor({_isComponent: true, parent: context, _parentVnode: vnode})

      child.$mount()
    }
  }

  return new VNode(context, `vue-component-${tag}`, data, key, undefined, undefined, {Ctor, children})
}