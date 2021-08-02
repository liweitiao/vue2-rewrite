let id = 0
class Dep {
  constructor() {
    this.id = id++
    this.subs = []
  }
  depend() {
    if (Dep.target) {
      // console.log('dep----depend---this---', this)
      Dep.target.addDep(this)
    }
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    // console.log('dep----notify----')
    this.subs.forEach(watcher => watcher.update())
  }
}
Dep.target = null

let stack = []

export function pushTarget(watcher) {
  Dep.target = watcher
  stack.push(watcher)
  // console.log(stack)
}

export function popTarget(watcher) {
  // Dep.target = null
  stack.pop()
  Dep.target = stack[stack.length - 1]
  // console.log('dep--popTarget--Dep.target---', Dep.target)
}

export default Dep