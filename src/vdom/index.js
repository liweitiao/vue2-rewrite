import { isReservedTag, isObject } from "../utils";

export function createElement(vm, tag, data = {}, ...children) {
  // console.log('vdom---tag---data--', tag, data)
  if (isReservedTag(tag)) {
    return vnode(vm, tag, data, data.key, children, undefined);
  } else {
    const Ctor = vm.$options.components[tag]
    return createComponent(vm, tag, data, data.key, children, Ctor)
  }
}

function createComponent(vm, tag, data, key, children, Ctor) {
  console.log('vdom---createComponent---Ctor---', Ctor)
  if (isObject(Ctor)) {
    Ctor = vm.$options._base.extend(Ctor)
  }
  data.hook = {
    init(vnode) {
      // debugger
      let child = vnode.componentInstance = new Ctor({_isComponent: true, parent: vm})

      // debugger
      child.$mount()
    }
  }
  // console.log('vdom---createComponent---Ctor---', Ctor)
  // console.log(vnode(vm, `vue-component-${tag}`, data, key, undefined, undefined, {Ctor, children}))
  return vnode(vm, `vue-component-${tag}`, data, key, undefined, undefined, {Ctor, children})
}

export function createTextElement(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text);
}

function vnode(vm, tag, data, key, children, text, componentOptions) {
  console.log('vnode----arguments---', arguments)
  return {
      vm,
      tag,
      data,
      key,
      children,
      text,
      componentOptions
      // .....
  }
}