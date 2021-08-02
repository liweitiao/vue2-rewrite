import { hasOwn } from './utils'
import { defineReactive } from './observer/index'

export function initProvide(vm) {
  const provide = vm.$options.provide
  console.log('inject----provide--', provide)
  if (provide) {
    vm._provided = typeof provide === 'function' ? provide.call(vm) : provide
  }
}


export function initInjections(vm) {
  const result = resolveInject(vm.$options.inject, vm)
  console.log('inject---initInjections---result---', result)
  if (result) {
    Object.keys(result).forEach(key => {
      defineReactive(vm, key, result[key])
    })
  }
}

export function resolveInject(inject, vm) {
  // debugger
  if (inject) {
    const result = Object.create(null)
    // const keys = Object.keys(inject)
    const keys = Reflect.ownKeys(inject)
    console.log('inject----resolveInject----result---', keys)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key === '__ob__') continue
      const provideKey = inject[key]
      let source = vm
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[inject[key]] = source._provided[provideKey]
          break
        }
        source = source.$parent
      }
      if (!source) {
        console.log('inject---key---', inject, key)
        if (key !== 'length' && 'default' in inject[key]) {
          const provideDefault = inject[key].default
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault
        }
      }
    }

    return result
  }
}