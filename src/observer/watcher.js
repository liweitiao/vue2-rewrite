import { popTarget, pushTarget } from "./dep";
import { queueWatcher } from './scheduler'

let id = 0
class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.user = !!options.user
    this.lazy = !!options.lazy
    this.dirty = options.lazy
    // console.log('dirty---', this.dirty)
    this.cb = cb
    this.options = options
    this.id = id++
    vm._watcher = this
    // this.getter = exprOrFn

    if (typeof exprOrFn == 'string') {
      this.getter = function() {
        let path = exprOrFn.split('.')
        let obj = vm
        for (let i = 0; i < path.length; i++) {
          obj = obj[path[i]]
        }
        // console.log('watcher---obj---', obj)
        // console.log('exprOrFn---', exprOrFn)
        return obj
      }
    } else {
      // console.log('exprOrFn---', exprOrFn)
      this.getter = exprOrFn
    }

    // console.log('watcher--getter---', this.getter)
    this.deps = []
    this.depsId = new Set()
    // this.get()
    this.value = this.lazy ? undefined : this.get()
    // this.value = this.get()
  }
  get() {
    pushTarget(this)
    const value = this.getter.call(this.vm)
    popTarget()

    // console.log('watcher--get---value---', value)
    return value
  }
  update() {
    if (this.lazy) {
      this.dirty = true
      // console.log('update----')
    } else {
      // console.log('update22----')
      queueWatcher(this)
    }
  }
  run() {
    let newValue = this.get()
    let oldValue = this.value
    this.value = newValue
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue)
    }
    // console.log('watcher---run---')
  }
  addDep(dep) {
    let id = dep.id
    if (!this.depsId.has(id)) {
      this.depsId.add(id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }
  evaluate() {
    this.dirty = false
    // console.log('watcher----dirty---', this.dirty)
    this.value = this.get()
  }
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }
}

export default Watcher