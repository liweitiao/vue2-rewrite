let oldArrayPrototype = Array.prototype
// console.log(oldArrayPrototype.length)
export let arrayMethods = Object.create(oldArrayPrototype)
// let arrayMethods = Object.create(oldArrayPrototype)

let methods = [
  'push',
  'shift',
  'unshift',
  'pop',
  'reverse',
  'sort',
  'splice'
]

methods.forEach(method => {
  arrayMethods[method] = function (...args) {
    oldArrayPrototype[method].call(this, ...args)
    let inserted
    let ob = this.__ob__
    switch (method) {
      case 'push':
      case 'unshift':
        // console.log('unshift')
        inserted = args
        break
      case 'splice':
        // console.log('splice')
        inserted = args.slice(2)
      default: 
        break
    }
    if (inserted) ob.observeArray(inserted)

    ob.dep.notify()
  }
})