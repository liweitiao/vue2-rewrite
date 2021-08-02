export function isFunction(val) {
  return typeof val === 'function';
}

export function isObject(val) {
  return typeof val == 'object' && val !== null
}

export const noop = () => {}

export function toArray (list) {
  let i = list.length
  const ret = new Array(i)
  while (i--) {
    ret[i] = list[i]
  }
  return ret
}


const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}



const callbacks = []

function flushCallbacks() {
  // console.log('utils---flushCallbacks---cbs--', callbacks)
  callbacks.forEach(cb => {
    // console.log('utils---flushCallbacks---cb---', cb)
    cb()
  })
  waiting = false
}

let waiting = false

function timer(flushCallbacks) {
  let timerFn = () => {}
  if (Promise) {
    timerFn = () => {
      Promise.resolve().then(flushCallbacks)
    }
  } else if (MutationObserver) {
    let textNode = document.createTextNode(1)
    let observe = new MutationObserver(flushCallbacks)
    observe.observe(textNode, {
      characterData: true
    })
    timerFn = () => {
      textNode.textContent = 3
    }
  } else if (setImmediate) {
    timerFn = () => {
      setImmediate(flushCallbacks)
    }
  } else {
    timerFn = () => {
      setTimeout(flushCallbacks)
    }
  }
  timerFn()
}

export function nextTick(cb) {
  callbacks.push(cb)

  if (!waiting) {
    timer(flushCallbacks)
    waiting = true
  }
}

let lifeCycleHooks = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
]
let strats = {}

function mergeHook(parentVal, childVal) {
  if (childVal) {
    if (parentVal) {
      return parentVal.concat(childVal)
    } else {
      return [childVal]
    }
  } else {
    return parentVal
  }
}

lifeCycleHooks.forEach(hook => {
  strats[hook] = mergeHook
})

strats.components = function(parentVal, childVal) {
  // console.log('parentVal--childVal---', parentVal, childVal)
  let options = Object.create(parentVal)
  // console.log('utils--components---options--', options)
  if (childVal) {
    for (let key in childVal) {
      options[key] = childVal[key]
    }
  }
  return options
}

export function mergeOptions(parent, child) {
  const options = {}
  for (let key in parent) {
    mergeField(key)
  }
  for (let key in child) {
    if (parent.hasOwnProperty(key)) {
      continue
    }
    mergeField(key)
  }

  function mergeField(key) {
    let parentVal = parent[key]
    let childVal = child[key]
    if (strats[key]) {
      options[key] = strats[key](parentVal, childVal)
    } else {
      if (isObject(parentVal) && isObject(childVal)) {
        options[key] = { ...parentVal, ...childVal }
      } else {
        options[key] = child[key] || parent[key]
      }
    }
  }
  return options
}

export function isReservedTag(str) {
  let reservedTag = 'a,div,span,p,img,button,ul,li';
  // 源码根据 “，” 生成映射表 {a:true,div:true,p:true}
  return reservedTag.includes(str);
}
