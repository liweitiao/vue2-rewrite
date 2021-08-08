import {  isObject, isUndef } from "../utils"
import VNode from "./vnode";
import { resolveAsyncComponent, createAsyncPlaceholder } from './helpers/index'
import { createEmptyVNode } from './vnode'
import { createElement } from './create-element'

export function createComponent(context, tag, data, key, children, Ctor) {
  debugger
  if (isUndef(Ctor)) {
    return createElement(context, tag, data, children)
  }

  const baseCtor = context.$options._base
  if (isObject(Ctor)) {
    Ctor = baseCtor.exend(Ctor)
  }

  var asyncFactory
  if (isUndef(Ctor.cid)) {

    // console.log('Ctor.cid---', Ctor.toString())
    debugger
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
    debugger
    if (Ctor === undefined) {
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }



  debugger
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