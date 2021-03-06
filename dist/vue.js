(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function isFunction(val) {
    return typeof val === 'function';
  }
  function isObject(val) {
    return typeof val == 'object' && val !== null;
  }
  const _toString = Object.prototype.toString;
  function isPlainObject(obj) {
    return _toString.call(obj) === '[object Object]';
  }
  function isUndef(v) {
    return v === undefined || v === null;
  }
  function isDef(v) {
    return v !== undefined && v !== null;
  }
  function isPromise(val) {
    return isDef(val) && typeof val.then === 'function' && typeof val.catch === 'function';
  }
  const noop = () => {};
  function isTrue(v) {
    return v === true;
  }
  function toArray(list) {
    let i = list.length;
    const ret = new Array(i);

    while (i--) {
      ret[i] = list[i];
    }

    return ret;
  }
  function once(fn) {
    let called = false;
    return function () {
      if (!called) {
        called = true;
        fn.apply(this, arguments);
      }
    };
  }
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
  }
  const callbacks = [];

  function flushCallbacks() {
    // console.log('utils---flushCallbacks---cbs--', callbacks)
    callbacks.forEach(cb => {
      // console.log('utils---flushCallbacks---cb---', cb)
      cb();
    });
    waiting = false;
  }

  let waiting = false;

  function timer(flushCallbacks) {
    let timerFn = () => {};

    if (Promise) {
      timerFn = () => {
        Promise.resolve().then(flushCallbacks);
      };
    } else if (MutationObserver) {
      let textNode = document.createTextNode(1);
      let observe = new MutationObserver(flushCallbacks);
      observe.observe(textNode, {
        characterData: true
      });

      timerFn = () => {
        textNode.textContent = 3;
      };
    } else if (setImmediate) {
      timerFn = () => {
        setImmediate(flushCallbacks);
      };
    } else {
      timerFn = () => {
        setTimeout(flushCallbacks);
      };
    }

    timerFn();
  }

  function nextTick(cb) {
    callbacks.push(cb);

    if (!waiting) {
      timer(flushCallbacks);
      waiting = true;
    }
  }
  let lifeCycleHooks = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed'];
  let strats = {};

  function mergeHook(parentVal, childVal) {
    if (childVal) {
      if (parentVal) {
        return parentVal.concat(childVal);
      } else {
        return [childVal];
      }
    } else {
      return parentVal;
    }
  }

  lifeCycleHooks.forEach(hook => {
    strats[hook] = mergeHook;
  });

  strats.components = function (parentVal, childVal) {
    // console.log('parentVal--childVal---', parentVal, childVal)
    let options = Object.create(parentVal); // console.log('utils--components---options--', options)

    if (childVal) {
      for (let key in childVal) {
        options[key] = childVal[key];
      }
    }

    return options;
  };

  function mergeOptions(parent, child) {
    const options = {};

    for (let key in parent) {
      mergeField(key);
    }

    for (let key in child) {
      if (parent.hasOwnProperty(key)) {
        continue;
      }

      mergeField(key);
    }

    function mergeField(key) {
      let parentVal = parent[key];
      let childVal = child[key];

      if (strats[key]) {
        options[key] = strats[key](parentVal, childVal);
      } else {
        if (isObject(parentVal) && isObject(childVal)) {
          options[key] = { ...parentVal,
            ...childVal
          };
        } else {
          options[key] = child[key] || parent[key];
        }
      }
    }

    return options;
  }
  function isReservedTag(str) {
    let reservedTag = 'a,div,span,p,img,button,ul,li,h1'; // ???????????? ????????? ??????????????? {a:true,div:true,p:true}

    return reservedTag.includes(str);
  }

  let oldArrayPrototype = Array.prototype; // console.log(oldArrayPrototype.length)

  let arrayMethods = Object.create(oldArrayPrototype); // let arrayMethods = Object.create(oldArrayPrototype)

  let methods = ['push', 'shift', 'unshift', 'pop', 'reverse', 'sort', 'splice'];
  methods.forEach(method => {
    arrayMethods[method] = function (...args) {
      oldArrayPrototype[method].call(this, ...args);
      let inserted;
      let ob = this.__ob__;

      switch (method) {
        case 'push':
        case 'unshift':
          // console.log('unshift')
          inserted = args;
          break;

        case 'splice':
          // console.log('splice')
          inserted = args.slice(2);
      }

      if (inserted) ob.observeArray(inserted);
      ob.dep.notify();
    };
  });

  let id$1 = 0;

  class Dep {
    constructor() {
      this.id = id$1++;
      this.subs = [];
    }

    depend() {
      if (Dep.target) {
        // console.log('dep----depend---this---', this)
        Dep.target.addDep(this);
      }
    }

    addSub(watcher) {
      this.subs.push(watcher);
    }

    notify() {
      // console.log('dep----notify----')
      this.subs.forEach(watcher => watcher.update());
    }

  }

  Dep.target = null;
  let stack = [];
  function pushTarget(watcher) {
    Dep.target = watcher;
    stack.push(watcher); // console.log(stack)
  }
  function popTarget(watcher) {
    // Dep.target = null
    stack.pop();
    Dep.target = stack[stack.length - 1]; // console.log('dep--popTarget--Dep.target---', Dep.target)
  }

  class Observer {
    constructor(data) {
      this.dep = new Dep();
      Object.defineProperty(data, '__ob__', {
        value: this,
        enumerable: false
      });

      if (Array.isArray(data)) {
        data.__proto__ = arrayMethods;
        this.observeArray(data);
      } else {
        this.walk(data);
      }
    }

    observeArray(data) {
      data.forEach(item => observe(item));
    }

    walk(data) {
      Object.keys(data).forEach(key => {
        defineReactive(data, key, data[key]);
      });
    }

  }

  function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
      let current = value[i];
      current.__ob__ && current.__ob__.dep.depend();

      if (Array.isArray(current)) {
        dependArray(current);
      }
    }
  }

  function defineReactive(data, key, value) {
    let childOb = observe(value); // console.log('observer---key---value--childOb---', key, value, childOb)

    let dep = new Dep(); // console.log('observer---key---dep---', key, dep)

    Object.defineProperty(data, key, {
      get() {
        // console.log('get--')
        if (Dep.target) {
          // console.log('observer---key---dep2---', key, dep)
          dep.depend();

          if (childOb) {
            childOb.dep.depend();

            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }

        return value;
      },

      set(newValue) {
        console.log('dep---newValue---', dep, newValue);

        if (newValue !== value) {
          observe(newValue);
          value = newValue; // debugger

          dep.notify();
        }
      }

    });
  }
  function observe(data) {
    if (!isObject(data)) {
      return;
    }

    if (data.__ob__) {
      return data.__ob__;
    }

    return new Observer(data);
  }

  let queue = [];
  let has = {};

  function flushSchedulerQueue() {
    for (let i = 0; i < queue.length; i++) {
      queue[i].run();
    }

    queue = [];
    has = {};
    pending = false;
  }

  let pending = false;
  function queueWatcher(watcher) {
    const id = watcher.id;

    if (has[id] == null) {
      queue.push(watcher);
      has[id] = true;

      if (!pending) {
        nextTick(flushSchedulerQueue);
        pending = true;
      }
    }
  }

  let id = 0;

  class Watcher {
    constructor(vm, exprOrFn, cb, options) {
      this.vm = vm;
      this.exprOrFn = exprOrFn;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.dirty = options.lazy; // console.log('dirty---', this.dirty)

      this.cb = cb;
      this.options = options;
      this.id = id++;
      vm._watcher = this; // this.getter = exprOrFn

      if (typeof exprOrFn == 'string') {
        this.getter = function () {
          let path = exprOrFn.split('.');
          let obj = vm;

          for (let i = 0; i < path.length; i++) {
            obj = obj[path[i]];
          } // console.log('watcher---obj---', obj)
          // console.log('exprOrFn---', exprOrFn)


          return obj;
        };
      } else {
        // console.log('exprOrFn---', exprOrFn)
        this.getter = exprOrFn;
      } // console.log('watcher--getter---', this.getter)


      this.deps = [];
      this.depsId = new Set(); // this.get()

      this.value = this.lazy ? undefined : this.get(); // this.value = this.get()
    }

    get() {
      pushTarget(this);
      const value = this.getter.call(this.vm);
      popTarget(); // console.log('watcher--get---value---', value)

      return value;
    }

    update() {
      if (this.lazy) {
        this.dirty = true; // console.log('update----')
      } else {
        // console.log('update22----')
        queueWatcher(this);
      }
    }

    run() {
      let newValue = this.get();
      let oldValue = this.value;
      this.value = newValue;

      if (this.user) {
        this.cb.call(this.vm, newValue, oldValue);
      } // console.log('watcher---run---')

    }

    addDep(dep) {
      let id = dep.id;

      if (!this.depsId.has(id)) {
        this.depsId.add(id);
        this.deps.push(dep);
        dep.addSub(this);
      }
    }

    evaluate() {
      this.dirty = false; // console.log('watcher----dirty---', this.dirty)

      this.value = this.get();
    }

    depend() {
      let i = this.deps.length;

      while (i--) {
        this.deps[i].depend();
      }
    }

  }

  function stateMixin(Vue) {
    Vue.prototype.$watch = function (key, handler, options = {}) {
      options.user = true; // console.log('state---$watch---this---', this)

      new Watcher(this, key, handler, options);
    };
  }
  function initState(vm) {
    const opts = vm.$options; // console.log('state----opts---', opts)

    if (opts.data) {
      initData(vm);
    }

    if (opts.methods) {
      initMethods(vm, opts.methods);
    }

    if (opts.watch) {
      initWatch(vm, opts.watch);
    }

    if (opts.computed) {
      initComputed(vm, opts.computed);
    }
  }

  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[source][key];
      },

      set(newValue) {
        vm[source][key] = newValue;
      }

    });
  }

  function initData(vm) {
    let data = vm.$options.data;
    data = vm._data = isFunction(data) ? data.call(vm) : data;

    for (let key in data) {
      proxy(vm, '_data', key);
    }

    observe(data);
  }

  function initMethods(vm, methods) {
    // console.log('initMethods---vm---methods---', vm, methods)
    for (const key in methods) {
      vm[key] = typeof methods[key] !== 'function' ? noop : methods[key].bind(vm);
    }
  }

  function initWatch(vm, watch) {
    for (let key in watch) {
      let handler = watch[key]; // console.log('state---handler----', handler)

      if (Array.isArray(handler)) {
        for (let i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  function createWatcher(vm, key, handler) {
    return vm.$watch(key, handler);
  }

  function initComputed(vm, computed) {
    const watchers = vm._computedWatchers = {};

    for (let key in computed) {
      const userDef = computed[key];
      let getter = typeof userDef == 'function' ? userDef : userDef.get;
      watchers[key] = new Watcher(vm, getter, () => {}, {
        lazy: true
      });
      defineComputed(vm, key, userDef);
    }
  }

  function createComputedGetter(key) {
    // console.log('createComputed---')
    return function computedGetter() {
      let watcher = this._computedWatchers[key]; // console.log('state----createComputedGetter-key--watcher---',key, watcher)

      if (watcher.dirty) {
        watcher.evaluate();
      } // console.log('state----createComputed----Dep.target---', Dep.target)


      if (Dep.target) {
        watcher.depend();
      }

      return watcher.value;
    };
  }

  function defineComputed(vm, key, userDef) {
    let sharedProperty = {};

    if (typeof userDef == 'function') {
      sharedProperty.get = userDef;
    } else {
      // sharedProperty.get = userDef.get
      sharedProperty.get = createComputedGetter(key); // sharedProperty.get()

      sharedProperty.set = userDef.set;
    }

    Object.defineProperty(vm, key, sharedProperty);
  }

  /* @flow */
  function initEvents(vm) {
    vm._events = Object.create(null);
  }

  function eventsMixin(Vue) {

    Vue.prototype.$on = function (event, fn) {
      console.log('$on----');
      const vm = this;

      if (Array.isArray(event)) {
        for (let i = 0, l = event.length; i < l; i++) {
          vm.$on(event[i], fn);
        }
      } else {
        (vm._events[event] || (vm._events[event] = [])).push(fn);
      }

      return vm;
    };

    Vue.prototype.$once = function (event, fn) {
      const vm = this;

      function on() {
        vm.$off(event, on);
        fn.apply(vm, arguments);
      }

      on.fn = fn;
      vm.$on(event, on);
      return vm;
    };

    Vue.prototype.$off = function (event, fn) {
      const vm = this;

      if (!arguments.length) {
        vm._events = Object.create(null);
        return vm;
      } // array of events


      if (Array.isArray(event)) {
        for (let i = 0, l = event.length; i < l; i++) {
          vm.$off(event[i], fn);
        }

        return vm;
      } // specific event


      const cbs = vm._events[event];

      if (!cbs) {
        return vm;
      }

      if (!fn) {
        vm._events[event] = null;
        return vm;
      } // specific handler


      let cb;
      let i = cbs.length;

      while (i--) {
        cb = cbs[i];

        if (cb === fn || cb.fn === fn) {
          cbs.splice(i, 1);
          break;
        }
      }

      return vm;
    };

    Vue.prototype.$emit = function (event) {
      console.log('$emit----');
      const vm = this;
      let cbs = vm._events[event];

      if (cbs) {
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        toArray(arguments);

        for (let i = 0, l = cbs.length; i < l; i++) {
          // invokeWithErrorHandling(cbs[i], vm, args, vm, info)
          cbs[i].call(vm);
        }
      }

      return vm;
    };
  }

  function patch(oldVnode, vnode) {
    // console.log('patch----')
    // debugger
    if (!oldVnode) {
      return createElm(vnode); // ????????????el?????????????????????????????????????????????????????????
    }

    if (oldVnode.nodeType == 1) {
      // ???vnode  ???????????????dom ???????????????dom??????
      const parentElm = oldVnode.parentNode; // ??????????????????

      let elm = createElm(vnode); //?????????????????? ????????????
      // ????????????????????? ????????????????????????????????????????????????

      parentElm.insertBefore(elm, oldVnode.nextSibling);
      parentElm.removeChild(oldVnode);
      return elm;
    } else {
      // ??????????????????????????? ????????????????????????????????????
      if (oldVnode.tag !== vnode.tag) {
        // ????????????vnode.el??????????????????????????????dom??????
        return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
      } // ?????????????????????????????? , ?????????????????????????????? ?????????????????? ?????????????????? ????????????


      let el = vnode.el = oldVnode.el; // ????????????????????? ???????????????
      // ???????????????????????????????????????  ?????????????????? ...

      if (vnode.tag == undefined) {
        // ??????????????????
        if (oldVnode.text !== vnode.text) {
          el.textContent = vnode.text;
        }

        return;
      }

      patchProps(vnode, oldVnode.data); // ??????????????????????????????
      // ??????????????? ??? ???????????????

      let oldChildren = oldVnode.children || [];
      let newChildren = vnode.children || [];

      if (oldChildren.length > 0 && newChildren.length > 0) {
        // ??????????????????
        //  vue???????????????????????? ????????? 
        patchChildren(el, oldChildren, newChildren);
      } else if (newChildren.length > 0) {
        // ??????????????? ?????????????????????
        for (let i = 0; i < newChildren.length; i++) {
          let child = createElm(newChildren[i]);
          el.appendChild(child); // ?????????????????????
        }
      } else if (oldChildren.length > 0) {
        // ??????????????? ???????????????
        el.innerHTML = ``; // ?????????????????????
      } // vue????????????????????????????????????watcher?????????????????????????????? ???????????????????????????


      return el;
    }
  }

  function isSameVnode(oldVnode, newVnode) {
    return oldVnode.tag == newVnode.tag && oldVnode.key == newVnode.key;
  } // dom????????? ast => render?????? => ???????????? => ??????dom
  // ???????????????????????????ast???????????????
  // ?????????????????????????????? ?????????vue?????????vue?????????????????? ?????????????????????ast??????
  // ????????????????????????????????????????????????dom??????
  // ??????????????????dom ??? vue??????????????????????????????ast?????????


  function patchChildren(el, oldChildren, newChildren) {
    let oldStartIndex = 0;
    let oldStartVnode = oldChildren[0];
    let oldEndIndex = oldChildren.length - 1;
    let oldEndVnode = oldChildren[oldEndIndex];
    let newStartIndex = 0;
    let newStartVnode = newChildren[0];
    let newEndIndex = newChildren.length - 1;
    let newEndVnode = newChildren[newEndIndex];

    const makeIndexByKey = children => {
      return children.reduce((memo, current, index) => {
        if (current.key) {
          memo[current.key] = index;
        }

        return memo;
      }, {});
    };

    const keysMap = makeIndexByKey(oldChildren);

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      // ???????????? ???????????? ???????????? ????????????
      // ????????? ??????????????? ???????????????????????????????????????????????????????????? ?????????
      if (!oldStartVnode) {
        // ?????????????????????
        oldStartVnode = oldChildren[++oldStartIndex];
      } else if (!oldEndVnode) {
        oldEndVnode = oldChildren[--oldEndIndex];
      } // ??????????????????????????? ????????????????????????????????????????????????


      if (isSameVnode(oldStartVnode, newStartVnode)) {
        // ????????????????????????????????????
        patch(oldStartVnode, newStartVnode);
        oldStartVnode = oldChildren[++oldStartIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameVnode(oldEndVnode, newEndVnode)) {
        // ?????????????????????
        patch(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIndex];
        newEndVnode = newChildren[--newEndIndex];
      } // ????????????  =??? reverse
      else if (isSameVnode(oldStartVnode, newEndVnode)) {
        patch(oldStartVnode, newEndVnode);
        el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling); // ??????????????????????????????????????????????????????????????????

        oldStartVnode = oldChildren[++oldStartIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVnode(oldEndVnode, newStartVnode)) {
        // ????????????
        patch(oldEndVnode, newStartVnode);
        el.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldChildren[--oldEndIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else {
        // ????????????   ??????diff
        // 1.????????????key??? ????????????????????????????????????????????????
        let moveIndex = keysMap[newStartVnode.key]; // ???????????????????????????

        if (moveIndex == undefined) {
          // ??????????????????????????????????????????????????????????????????
          el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
        } else {
          let moveNode = oldChildren[moveIndex];
          oldChildren[moveIndex] = null; // ??????????????????????????????

          el.insertBefore(moveNode.el, oldStartVnode.el);
          patch(moveNode, newStartVnode); // ???????????????????????????
        }

        newStartVnode = newChildren[++newStartIndex];
      }
    } // ???????????????????????????????????????  
    // ???????????????????????????


    if (newStartIndex <= newEndIndex) {
      for (let i = newStartIndex; i <= newEndIndex; i++) {
        // el.appendChild(createElm(newChildren[i]))  
        // insertBefore?????? ?????????appendChild?????? insertBefore(??????,null)  dom api
        //  ????????????????????????????????????????????????
        let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el;
        el.insertBefore(createElm(newChildren[i]), anchor);
      }
    }

    if (oldStartIndex <= oldEndIndex) {
      for (let i = oldStartIndex; i <= oldEndIndex; i++) {
        //  ??????????????? ?????????????????? ??? ?????????????????????null ?????????
        if (oldChildren[i] !== null) el.removeChild(oldChildren[i].el);
      }
    }
  } // ?????????????????????


  function patchProps(vnode, oldProps = {}) {
    // ???????????????????????????????????????????????????????????????????????????
    let newProps = vnode.data || {};
    let el = vnode.el; // ????????????????????????????????????????????????

    let newStyle = newProps.style || {};
    let oldStyle = oldProps.style || {};

    for (let key in oldStyle) {
      if (!newStyle[key]) {
        // ?????????????????????????????????
        el.style[key] = '';
      }
    }

    for (let key in oldProps) {
      if (!newProps[key]) {
        el.removeAttribute(key);
      }
    } // ?????????????????????????????????


    for (let key in newProps) {
      if (key === 'style') {
        for (let styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else {
        //   debugger
        if (typeof newProps[key] === 'string') continue;
        el.setAttribute(key, newProps[key]);
      }
    }
  }

  function createComponent$1(vnode) {
    let i = vnode.data; //  vnode.data.hook.init

    if (i && (i = i.hook) && (i = i.init)) {
      i(vnode); // ??????init??????
    }

    if (vnode.componentInstance) {
      // ????????????????????????new???????????????????????????????????????DOM????????????componentInstance.$el
      return true;
    }
  }

  function createElm(vnode) {
    if (typeof vnode === 'string') {
      return document.createTextNode(vnode);
    }

    if (isUndef(vnode)) {
      return document.createTextNode('');
    } //   debugger


    if (Array.isArray(vnode)) {
      vnode.forEach(item => {
        let {
          tag,
          data,
          children,
          text,
          context
        } = Array.isArray(item) ? item[0] : item;

        if (typeof tag === 'string') {
          // ??????
          if (createComponent$1(vnode)) {
            // ?????????????????????????????????
            return vnode.componentInstance.$el;
          }

          item.el = document.createElement(tag); // ????????????????????????el?????? ??????????????????

          patchProps(item);
          children.forEach(child => {
            // console.log('createElm-----Array--child---', child)
            let e = createElm(child); // console.log('createElm----Array---e---', e)

            item.el.appendChild(e);
          });
        } else {
          //   debugger
          vnode.el = document.createTextNode(text);
        }
      });
      return vnode;
    } else {
      //   let { tag, data, children, text, context } = Array.isArray(vnode) ? vnode[0] : vnode
      let {
        tag,
        data,
        children,
        text,
        context
      } = vnode;

      if (typeof tag === 'string') {
        // ??????
        if (createComponent$1(vnode)) {
          // ?????????????????????????????????
          return vnode.componentInstance.$el;
        }

        vnode.el = document.createElement(tag); // ????????????????????????el?????? ??????????????????

        patchProps(vnode);
        children.forEach(child => {
          // console.log('createElm-----noArray--child---', child)
          let e = createElm(child); // console.log('createElm-----noArray---e---', e)

          e.forEach(i => {
            vnode.el.appendChild(i.el);
          });
        });
      } else {
        //   debugger
        vnode.el = document.createTextNode(text);
      }
    }

    return vnode.el;
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      const vm = this; // debugger

      vm.$el; // previously ??????

      const prevVnode = vm._vnode;
      vm._vnode = vnode; // debugger

      if (!prevVnode) {
        vm.$el = patch(vm.$el, vnode);
      } else {
        vm.$el = patch(prevVnode, vnode);
      }
    };

    Vue.prototype.$nextTick = nextTick;

    Vue.prototype.$forceUpdate = function () {
      // debugger
      const vm = this;

      if (vm._watcher) {
        vm._watcher.update();
      }
    };
  }
  function initLifecycle(vm) {
    const options = vm.$options; // locate first non-abstract parent

    let parent = options.parent;

    if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
        parent = parent.$parent;
      }

      parent.$children.push(vm);
    }

    vm.$parent = parent;
    vm.$root = parent ? parent.$root : vm;
    vm.$children = [];
    vm.$refs = {};
    vm._watcher = null;
    vm._inactive = null;
    vm._directInactive = false;
    vm._isMounted = false;
    vm._isDestroyed = false;
    vm._isBeingDestroyed = false;
  }
  function mountComponent(vm, el) {
    let updateComponent = () => {
      let vnode = vm._render(); // console.log('lifecycle----mountComponent----vnode----', vnode)
      // debugger


      vm._update(vnode);
    };

    callHook(vm, 'beforeMount');
    new Watcher(vm, updateComponent, () => {
      console.log('??????????????????');
    }, true); // updateComponent()

    callHook(vm, 'mounted');
  }
  function callHook(vm, hook) {
    let handlers = vm.$options[hook];

    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        handlers[i].call(vm);
      }
    }
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}
  // html????????? =??? ?????????  _c('div',{id:'app',a:1},'hello')

  function genProps(attrs) {
    // [{name:'xxx',value:'xxx'},{name:'xxx',value:'xxx'}]
    let str = '';

    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];

      if (attr.name === 'style') {
        // color:red;background:blue
        let styleObj = {};
        attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
          styleObj[arguments[1]] = arguments[2];
        });
        attr.value = styleObj;
      }

      if (attr.name === 'v-if') {
        console.log('codegen---genProps----attr.name---', attr.name);
        continue;
      }

      str += `${attr.name}:${JSON.stringify(attr.value)},`;
    }

    return `{${str.slice(0, -1)}}`;
  }

  function gen(el) {
    if (el.type == 1) {
      // element = 1 text = 3
      return generate(el);
    } else {
      let text = el.text;

      if (!defaultTagRE.test(text)) {
        return `_v('${text}')`;
      } else {
        // 'hello' + arr + 'world'    hello {{arr}} {{aa}} world
        let tokens = [];
        let match;
        let lastIndex = defaultTagRE.lastIndex = 0; // CSS-LOADER ????????????

        while (match = defaultTagRE.exec(text)) {
          // ?????????????????????
          let index = match.index; // ????????????

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push(`_s(${match[1].trim()})`); // JSON.stringify()

          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }

        return `_v(${tokens.join('+')})`;
      }
    }
  }

  function genChildren(el) {
    let children = el.children; // ????????????

    if (children) {
      return children.map(c => gen(c)).join(',');
    }

    return false;
  }

  function genData(el) {
    let data = '{';

    if (el.slotTarget) {
      data += `slot:${el.slotTarget}`;
    }

    data += '}';
    return data;
  }

  function genSlot(el) {
    var slotName = el.slotName || '"default"';
    var children = genChildren(el);
    var res = "_t(" + slotName + (children ? ",function(){return " + children + "}" : ''); // TODO...
    // var attrs = el.attrs || el.dynamicAttrs

    res += ')'; // debugger

    return res;
  }

  function genIf(el) {
    return `(${el.attrsMap['v-if']})?_c('${el.tag}',${genProps(el.attrs)},${genChildren(el)}):_e()`;
  }

  function genFor(el) {
    // debugger
    // console.log('genFor---el----', el)
    let arr = el.attrsMap['v-for'].split(' ');
    let exp = arr[2];
    let alias = arr[0];
    return `_l((${exp}),function(${alias}){return _c('div',{},_v(_s(a)))})`;
  }

  function generate(el) {
    //  _c('div',{id:'app',a:1},_c('span',{},'world'),_v())
    // ????????? ????????????????????????
    const code = el ? genElement(el) : '_c("div")';
    return code;
  }
  function genElement(el) {

    if (!el.plain) {
      genData(el);
    }

    for (let i = 0; i < el.attrs.length; i++) {
      el.attrsMap[el.attrs[i]['name']] = el.attrs[i]['value'];
    } // debugger


    if (el.attrsMap['v-for']) {
      return genFor(el);
    } else if (el.attrsMap['v-if']) {
      // debugger
      return genIf(el);
    } else if (el.tag === 'slot') {
      return genSlot(el);
    } else {
      let children = genChildren(el); // debugger

      let code = `_c('${el.tag}',${el.attrs.length ? genProps(el.attrs) : 'undefined'}${children ? `,${children}` : ''})`;
      return code;
    }
  }

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // ????????? 

  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  ??????????????????????????? match???????????????1???
  // console.log('<aa:bbb>'.match(new RegExp(qnameCapture)))

  const startTagOpen = new RegExp(`^<${qnameCapture}`); // ????????????????????? 

  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // ?????????????????????
  //           aa  =   "  xxx "  | '  xxxx '  | xxx

  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'

  const startTagClose = /^\s*(\/?)>/; //     />   <div/>

  function parseHTML(html, options) {
    function advance(len) {
      html = html.substring(len);
    }

    function parseStartTag() {
      const start = html.match(startTagOpen); // debugger

      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);
        let end; // ????????????????????????????????????????????????

        let attr;

        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          // debugger  
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
          advance(attr[0].length);
        }

        if (end) {
          advance(end[0].length);
        }

        return match;
      }

      return false; // ??????????????????
    }

    while (html) {
      let textEnd = html.indexOf('<');

      if (textEnd == 0) {
        const startTagMatch = parseStartTag(); // debugger

        if (startTagMatch) {
          options.start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }

        const endTagMatch = html.match(endTag);

        if (endTagMatch) {
          // debugger
          options.end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }
      }

      let text; // //  </div>

      if (textEnd > 0) {
        text = html.substring(0, textEnd);
      }

      if (text) {
        options.chars(text);
        advance(text.length);
      }
    }
  }

  function addAttr(el, name, value, dynamic) {
    const attrs = dynamic ? el.dynamicAttrs || (el.dynamicAttrs = []) : el.attrs || (el.attrs = []);
    attrs.push({
      name,
      value,
      dynamic
    });
    el.plain = false;
  }

  // // ?????????????????????????????? , ??????????????????????????? template, template?????????????????????
  function createAstElement(tagName, attrs) {
    return {
      tag: tagName,
      type: 1,
      children: [],
      parent: null,
      attrs
    };
  }
  function parse(template, options) {
    let root;
    let currentParent;
    const stack = [];

    function closeElement(element) {
      // processElement(element)
      // debugger
      element = processElement(element); // processSlotContent(el)
      // currentParent || currentParent.children.push(element)

      element.parent = currentParent; // debugger
      // return element
    }

    function processElement(element) {
      processSlotContent(element);
      processSlotOutlet(element); // debugger

      return element;
    }

    function processSlotOutlet(el) {
      if (el.tag === 'slot') {
        // debugger
        el.slotName = `"${getBindingAttr(el)}"`;
      }
    }

    function getBindingAttr(el, name) {
      let slotTarget = el.attrs[0] && el.attrs[0]['value'];
      return slotTarget;
    }

    function processSlotContent(el) {
      // debugger
      var slotTarget = getBindingAttr(el);

      if (slotTarget) {
        el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
        el.attrsMap = el.attrsMap || {};
        el.attrsMap['slot'] = slotTarget;
        el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);

        if (!el.slotScope) {
          addAttr(el, 'slot', slotTarget, getBindingAttr(el));
        }
      }
    }

    parseHTML(template, {
      start(tagName, attributes) {
        let parent = stack[stack.length - 1];
        let element = createAstElement(tagName, attributes);

        if (!root) {
          root = element;
        }

        if (parent) {
          element.parent = parent; // ?????????????????? ??????????????????

          parent.children.push(element);
        }

        stack.push(element);
      },

      end(tagName) {
        const element = stack[stack.length - 1];
        stack.length -= 1;
        currentParent = stack[stack.length - 1];

        if (element.tag !== tagName) {
          throw new Error('????????????');
        } // debugger


        closeElement(element); // debugger
      },

      chars(text) {
        text = text.replace(/\s/g, "");
        let parent = stack[stack.length - 1];

        if (text) {
          parent.children.push({
            type: 3,
            text
          });
        }
      }

    });
    return root;
  }

  function compileToFunction(template) {
    let root = parse(template); // console.log('compiler----root----', root)
    // ???????????? 

    let code = generate(root); // console.log('compiler----code---', code)

    let render = new Function(`with(this){return ${code}}`); // code ?????????????????? ?????????vm???
    // console.log('compiler----render----', render)

    return render; // render(){
    //     return
    // }
    // html=> ast????????????????????? ??????????????????????????????????????? => render?????? + (with + new Function) => ??????dom ??????????????????????????? => ????????????dom
  }

  function initProvide(vm) {
    const provide = vm.$options.provide; // console.log('inject----provide--', provide)

    if (provide) {
      vm._provided = typeof provide === 'function' ? provide.call(vm) : provide;
    }
  }
  function initInjections(vm) {
    const result = resolveInject(vm.$options.inject, vm); // console.log('inject---initInjections---result---', result)

    if (result) {
      Object.keys(result).forEach(key => {
        defineReactive(vm, key, result[key]);
      });
    }
  }
  function resolveInject(inject, vm) {
    // debugger
    if (inject) {
      const result = Object.create(null); // const keys = Object.keys(inject)

      const keys = Reflect.ownKeys(inject); // console.log('inject----resolveInject----result---', keys)

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === '__ob__') continue;
        const provideKey = inject[key];
        let source = vm;

        while (source) {
          if (source._provided && hasOwn(source._provided, provideKey)) {
            result[inject[key]] = source._provided[provideKey];
            break;
          }

          source = source.$parent;
        }

        if (!source) {
          // console.log('inject---key---', inject, key)
          if (key !== 'length' && 'default' in inject[key]) {
            const provideDefault = inject[key].default;
            result[key] = typeof provideDefault === 'function' ? provideDefault.call(vm) : provideDefault;
          }
        }
      }

      return result;
    }
  }

  class VNode {
    constructor(context, tag, data, key, children, text, componentOptions) {
      this.context = context;
      this.tag = tag;
      this.data = data;
      this.key = key;
      this.children = children;
      this.text = text;
      this.componentOptions = componentOptions;
    }

  }
  const createEmptyVNode = (text = '') => {
    const node = new VNode();
    node.text = text;
    node.isComment = true;
    return node;
  };

  function ensureCtor(comp, base) {
    return isObject(comp) ? base.extend(comp) : comp;
  }

  function createAsyncPlaceholder(factory, data, context, children, tag) {
    const node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = {
      data,
      context,
      children,
      tag
    };
    return node;
  }
  function resolveAsyncComponent(factory, baseCtor) {
    // debugger
    console.log('resolveAsyncComponent--factory--baseCtor---', factory, baseCtor);

    if (isDef(factory.resolved)) {
      return factory.resolved;
    }

    var owner = currentRenderingInstance;

    if (owner && !isDef(factory.owners)) {
      console.log('resolveAsyncComponent----owner---'); // debugger

      const owners = factory.owners = [owner];
      let sync = true;

      const forceRender = renderCompleted => {
        for (let i = 0, l = owners.length; i < l; i++) {
          owners[i].$forceUpdate();
        }

        if (renderCompleted) {
          owners.length = 0;
        }
      };

      const resolve = once(res => {
        console.log('res----', res); // debugger

        factory.resolved = ensureCtor(res, baseCtor);

        if (!sync) {
          forceRender(true);
        } else {
          owners.length = 0;
        }
      });
      const reject = once(reason => {
        process.env.NODE_ENV !== 'production' && warn(`Failed to resolve async component: ${String(factory)}` + (reason ? `\nReason: ${reason}` : ''));
      }); // debugger

      const res = factory(resolve, reject); // debugger

      if (isObject(res)) {
        if (isPromise(res)) {
          if (isUndef(factory.resolved)) {
            res.then(resolve, reject);
          }
        }
      }

      sync = false;
      return factory.loading ? factory.loadingComp : factory.resolved;
    }
  }

  function FunctionalRenderContext(data, children, parent, Ctor) {
    // debugger
    Ctor.options;
    let contextVm;

    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent);
      contextVm._original = parent;
    } else {
      contextVm = parent;
      parent = parent._original;
    }

    this.data = data;
    this.children = children;
    this.parent = parent;

    this._c = (a, b, c, d) => createElement(contextVm, a, b, c, d);
  }

  function createFunctionalComponent(Ctor, data, contextVm, children) {
    // debugger
    const options = Ctor.options;
    const renderContext = new FunctionalRenderContext(data, children, contextVm, Ctor); // debugger

    const vnode = options.render.call(null, renderContext._c, renderContext); // debugger

    if (vnode instanceof VNode) {
      return vnode;
    }
  }

  function createComponent(context, tag, data, key, children, Ctor) {
    // debugger
    if (isUndef(Ctor)) {
      return createElement(context, tag, data, children);
    }

    const baseCtor = context.$options._base;

    if (isObject(Ctor)) {
      Ctor = baseCtor.exend(Ctor);
    }

    var asyncFactory;

    if (isUndef(Ctor.cid)) {
      // console.log('Ctor.cid---', Ctor.toString())
      // debugger
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory, baseCtor); // debugger

      if (Ctor === undefined) {
        return createAsyncPlaceholder(asyncFactory, data, context, children, tag);
      }
    }

    if (isTrue(Ctor.options.functional)) {
      // debugger
      return createFunctionalComponent(Ctor, data, context, children);
    } // debugger
    // data.hook = {
    //   init(vnode) {
    //     console.log('init----vnode---', vnode)
    //     let child = vnode.componentInstance = new Ctor({_isComponent: true, parent: context, _parentVnode: vnode})
    //     child.$mount()
    //   }
    // }


    installComponentHooks(data);
    console.log('createComponent---data---', data);
    const vnode = new VNode(context, `vue-component-${tag}`, data, key, undefined, undefined, {
      Ctor,
      children
    });
    return vnode;
  }
  const componentVNodeHooks = {
    init(vnode) {
      if (vnode.componentInstance) ; else {
        const child = vnode.componentInstance = createComponentInstanceForVnode(vnode);
        child.$mount();
      }
    }

  };
  const hooksToMerge = Object.keys(componentVNodeHooks);

  function createComponentInstanceForVnode(vnode) {
    const options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: vnode.context
    };
    return new vnode.componentOptions.Ctor(options);
  }

  function installComponentHooks(data) {
    const hooks = data.hook || (data.hook = {});

    for (let i = 0; i < hooksToMerge.length; i++) {
      const key = hooksToMerge[i];
      const value = componentVNodeHooks[key];
      hooks[key] = value;
    }
  }

  function createElement(context, tag, data = {}, ...children) {
    // TODO...
    return _createElement(context, tag, data, children);
  }
  function _createElement(context, tag, data, children) {
    let vnode;

    if (isReservedTag(tag)) {
      vnode = new VNode(context, tag, data, data.key, children, undefined);
    } else {
      const Ctor = context.$options.components[tag];
      vnode = createComponent(context, tag, data, data.key, children, Ctor);
      return vnode;
    }

    return vnode;
  }
  function createTextElement(context, text) {
    return new VNode(context, undefined, undefined, undefined, undefined, text);
  }

  // import { createElement, createTextElement } from "./vdom/index"
  function installRenderHelpers(target) {
    target._c = function () {
      return createElement(this, ...arguments);
    };

    target._v = function (text) {
      return createTextElement(this, text);
    };

    target._s = function (val) {
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    };

    target._t = function (name) {
      let nodes; // debugger

      nodes = this.$slots[name];
      return nodes;
    };

    target._e = function (name) {
      return createEmptyVNode(name);
    };

    target._l = function (val, render) {
      // debugger
      let ret, i, l;

      if (Array.isArray(val) || typeof val === 'string') {
        ret = new Array(val.length);

        for (i = 0, l = val.length; i < l; i++) {
          ret[i] = render(val[i], i);
        }
      }

      return ret;
    };
  }
  function resolveSlots(children, context) {
    if (!children || !children.length) {
      return {};
    } // debugger


    const slots = {};

    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i];
      const data = child ? child.data : {}; // if (data && data.slot) {
      //   delete data.slot
      // }

      if (data && data.slot != null) {
        const name = data.slot;
        const slot = slots[name] || (slots[name] = []);
        slot.push(child);
      } else {
        (slots.default || (slots.default = [])).push(child);
      }
    }

    return slots;
  }

  function initRender(vm) {
    vm._vnode = null; // debugger

    const options = vm.$options;
    vm.$vnode = options._parentVnode; // const renderContext = parentVnode && parentVnode.context
    // change...FIXME...

    vm && vm.$parent;
    vm.$slots = resolveSlots(options._renderChildren);

    vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d);
  }
  let currentRenderingInstance = null;
  function renderMixin(Vue) {
    // console.log('renderMixin---')
    installRenderHelpers(Vue.prototype);

    Vue.prototype._render = function () {
      const vm = this;
      const {
        render,
        _parentVnode
      } = vm.$options;
      vm.$vnode = _parentVnode; // console.log('render---', render.toString())
      // debugger

      currentRenderingInstance = vm;
      let vnode = render.call(vm._renderProxy, vm.$createElement);
      vnode.parent = _parentVnode;
      return vnode;
    };
  }

  let uid = 0;
  function initMixin(Vue) {
    // console.log('initMixin----')
    Vue.prototype._init = function (options) {
      const vm = this;
      vm._uid = uid++;
      vm._isVue = true;

      if (options && options._isComponent) {
        initInternalComponent(vm, options);
      } else {
        vm.$options = mergeOptions(vm.constructor.options, options);
      }

      vm._renderProxy = vm;
      vm._self = vm; // console.log('init---vm.$options---', vm.$options)

      initLifecycle(vm);
      initEvents(vm);
      initRender(vm);
      callHook(vm, 'beforeCreate'); // debugger

      initInjections(vm);
      initState(vm);
      initProvide(vm);
      callHook(vm, 'created');

      if (vm.$options.el) {
        // debugger
        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      // console.log('$mount----el---', el)
      const vm = this;
      const options = vm.$options;
      el = document.querySelector(el);
      vm.$el = el;

      if (!options.render) {
        let template = options.template;

        if (!template && el) {
          template = el.outerHTML; // console.log('template---', template)
        }

        let render = compileToFunction(template);
        options.render = render;
      } // debugger


      mountComponent(vm);
    };
  }
  function initInternalComponent(vm, options) {
    const opts = vm.$options = Object.create(vm.constructor.options); // debugger
    // console.log('vm---', vm, options)

    const parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;
    const vnodeComponentOptions = parentVnode.componentOptions;
    opts._renderChildren = vnodeComponentOptions.children;
  }

  function initGlobalApi(Vue) {
    Vue.cid = 0;
    let cid = 1;
    Vue.options = {};

    Vue.mixin = function (options) {
      this.options = mergeOptions(this.options, options); // console.log('initGlobal-----options----', this.options)

      return this;
    };

    Vue.options._base = Vue;
    Vue.options.components = {};

    Vue.component = function (id, definition) {
      if (isPlainObject(definition)) {
        definition = this.options._base.extend(definition);
      } // console.log('global-api----component---definition---', definition)


      this.options.components[id] = definition;
    };

    Vue.extend = function (opts) {
      const Super = this;

      const Sub = function VueComponent(options) {
        this._init(options);
      };

      Sub.prototype = Object.create(Super.prototype);
      Sub.prototype.constructor = Sub;
      Sub.cid = cid++;
      Sub.options = mergeOptions(Super.options, opts); // console.log('global-api----extend----Sub.options---', Sub.options)

      return Sub;
    };
  }

  function Vue(options) {
    // console.log('Vue---')
    this._init(options);
  }

  initMixin(Vue);
  eventsMixin(Vue);
  renderMixin(Vue);
  lifecycleMixin(Vue);
  stateMixin(Vue);
  initGlobalApi(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
