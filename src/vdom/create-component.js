import {  isObject } from "../utils"
import VNode from "./vnode";

export function createComponent(context, tag, data, key, children, Ctor) {
  const baseCtor = context.$options._base
  if (isObject(Ctor)) {
    Ctor = baseCtor.exend(Ctor)
  }
  // data.hook = {
  //   init(vnode) {
  //     console.log('init----vnode---', vnode)
  //     let child = vnode.componentInstance = new Ctor({_isComponent: true, parent: context, _parentVnode: vnode})

  //     child.$mount()
  //   }
  // }
  installComponentHooks(data)
  console.log('createComponent---data---', data)

  const vnode = new VNode(context, `vue-component-${tag}`, data, key, undefined, undefined, {Ctor, children})
  return vnode
}


const componentVNodeHooks = {
  init (vnode) {
    if (vnode.componentInstance) {

    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(vnode)
      
      child.$mount()
    }
  }
}

const hooksToMerge = Object.keys(componentVNodeHooks)

function createComponentInstanceForVnode(vnode) {
  const options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent: vnode.context
  }

  return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks(data) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const value = componentVNodeHooks[key]
    hooks[key] = value
  }
}