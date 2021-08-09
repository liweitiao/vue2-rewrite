import { currentRenderingInstance } from '../../render'
import { isDef, once, isObject, isPromise, isUndef } from '../../utils';
import { createEmptyVNode } from '../vnode'

function ensureCtor(comp, base) {
  return isObject(comp) ? base.extend(comp) : comp
}

export function createAsyncPlaceholder (factory, data, context, children, tag) {
  const node = createEmptyVNode()
  node.asyncFactory = factory
  node.asyncMeta = { data, context, children, tag }

  return node
}

export function resolveAsyncComponent(factory, baseCtor) {
  
  // debugger
  console.log('resolveAsyncComponent--factory--baseCtor---', factory, baseCtor)
  
  if (isDef(factory.resolved)) {
    return factory.resolved
  }
  
  var owner = currentRenderingInstance

  if (owner && !isDef(factory.owners)) {
    console.log('resolveAsyncComponent----owner---')
    // debugger
    const owners = factory.owners = [owner]
    let sync = true
    let timerLoading = null
    let timerTimeout = null

    const forceRender = (renderCompleted) => {
      for (let i = 0, l = owners.length; i < l; i++) {
        (owners[i]).$forceUpdate()
      }

      if (renderCompleted) {
        owners.length = 0
        if (timerLoading !== null) {
          clearTimeout(timerLoading)
          timerLoading = null
        }
        if (timerTimeout !== null) {
          clearTimeout(timerTimeout)
          timerTimeout = null
        }
      }
    }

    const resolve = once((res) => {
      console.log('res----', res)
      // debugger
      factory.resolved = ensureCtor(res, baseCtor)
      if (!sync) {
        forceRender(true)
      } else {
        owners.length = 0
      }
    })

    const reject = once(reason => {
      process.env.NODE_ENV !== 'production' && warn(
        `Failed to resolve async component: ${String(factory)}` +
        (reason ? `\nReason: ${reason}` : '')
      )
    })

    // debugger
    const res = factory(resolve, reject)
    // debugger


    if(isObject(res)) {
      if (isPromise(res)) {
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject)
        }
      }
    }

    sync = false
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}