import { isObject } from '../utils'
import { arrayMethods } from './array'
import Dep from './dep'

class Observer {
  constructor(data) {
    this.dep = new Dep()
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false
    })

    if (Array.isArray(data)) {
      data.__proto__ = arrayMethods
      this.observeArray(data)
    } else {
      this.walk(data)
    }
  }

  observeArray(data) {
    data.forEach(item => observe(item))
  }

  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key])
    })
  }
}

function dependArray(value) {
  for (let i = 0; i < value.length; i++) {
    let current = value[i]
    current.__ob__ && current.__ob__.dep.depend()
    if (Array.isArray(current)) {
      dependArray(current)
    }
  }
}

export function defineReactive(data, key, value) {
  let childOb = observe(value)
  // console.log('observer---key---value--childOb---', key, value, childOb)
  let dep = new Dep()
  // console.log('observer---key---dep---', key, dep)
  Object.defineProperty(data, key, {
    get() {
      // console.log('get--')
      if (Dep.target) {
        console.log('observer---key---dep2---', key, dep)
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set(newValue) {
      console.log('dep---newValue---', dep, newValue)
      if (newValue !== value) {
        observe(newValue)
        value = newValue
        // debugger
        dep.notify()
      }
    }
  })
}

export function observe(data) {
  if (!isObject(data)) {
    return
  }
  if(data.__ob__) {
    return data.__ob__
  }

  return new Observer(data)
}