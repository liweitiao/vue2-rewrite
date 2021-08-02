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
  const noop = () => {};
  function toArray(list) {
    let i = list.length;
    const ret = new Array(i);

    while (i--) {
      ret[i] = list[i];
    }

    return ret;
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
    let reservedTag = 'a,div,span,p,img,button,ul,li'; // 源码根据 “，” 生成映射表 {a:true,div:true,p:true}

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
      this.id = id++; // this.getter = exprOrFn

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
    if (!oldVnode) {
      return createElm(vnode); // 如果没有el元素，那就直接根据虚拟节点返回真实节点
    }

    if (oldVnode.nodeType == 1) {
      // 用vnode  来生成真实dom 替换原本的dom元素
      const parentElm = oldVnode.parentNode; // 找到他的父亲

      let elm = createElm(vnode); //根据虚拟节点 创建元素
      // 在第一次渲染后 是删除掉节点，下次在使用无法获取

      parentElm.insertBefore(elm, oldVnode.nextSibling);
      parentElm.removeChild(oldVnode);
      return elm;
    } else {
      // 如果标签名称不一样 直接删掉老的换成新的即可
      if (oldVnode.tag !== vnode.tag) {
        // 可以通过vnode.el属性。获取现在真实的dom元素
        return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
      } // 如果标签一样比较属性 , 传入新的新的虚拟节点 ，和老的属性 。用新的属性 更新老的


      let el = vnode.el = oldVnode.el; // 表示当前新节点 复用老节点
      // 如果两个虚拟节点是文本节点  比较文本内容 ...

      if (vnode.tag == undefined) {
        // 新老都是文本
        if (oldVnode.text !== vnode.text) {
          el.textContent = vnode.text;
        }

        return;
      }

      patchProps(vnode, oldVnode.data); // 属性可能有删除的情况
      // 一方有儿子 ， 一方没儿子

      let oldChildren = oldVnode.children || [];
      let newChildren = vnode.children || [];

      if (oldChildren.length > 0 && newChildren.length > 0) {
        // 双方都有儿子
        //  vue用了双指针的方式 来比对 
        patchChildren(el, oldChildren, newChildren);
      } else if (newChildren.length > 0) {
        // 老的没儿子 但是新的有儿子
        for (let i = 0; i < newChildren.length; i++) {
          let child = createElm(newChildren[i]);
          el.appendChild(child); // 循环创建新节点
        }
      } else if (oldChildren.length > 0) {
        // 老的有儿子 新的没儿子
        el.innerHTML = ``; // 直接删除老节点
      } // vue的特点是每个组件都有一个watcher，当前组件中数据变化 只需要更新当前组件


      return el;
    }
  }

  function isSameVnode(oldVnode, newVnode) {
    return oldVnode.tag == newVnode.tag && oldVnode.key == newVnode.key;
  } // dom的生成 ast => render方法 => 虚拟节点 => 真实dom
  // 更新时需要重新创建ast语法树吗？
  // 如果动态的添加了节点 （绕过vue添加的vue监控不到的） 难道不需要重新ast吗？
  // 后续数据变了，只会操作自己管理的dom元素
  // 如果直接操作dom 和 vue无关，不需要重新创建ast语法树


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
      // 头头比较 尾尾比较 头尾比较 尾头比较
      // 优化了 向后添加， 向前添加，尾巴移动到头部，头部移动到尾部 ，反转
      if (!oldStartVnode) {
        // 已经被移动走了
        oldStartVnode = oldChildren[++oldStartIndex];
      } else if (!oldEndVnode) {
        oldEndVnode = oldChildren[--oldEndIndex];
      } // 同时循环新的节点和 老的节点，有一方循环完毕就结束了


      if (isSameVnode(oldStartVnode, newStartVnode)) {
        // 头头比较，发现标签一致，
        patch(oldStartVnode, newStartVnode);
        oldStartVnode = oldChildren[++oldStartIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameVnode(oldEndVnode, newEndVnode)) {
        // 从尾部开始比较
        patch(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIndex];
        newEndVnode = newChildren[--newEndIndex];
      } // 头尾比较  =》 reverse
      else if (isSameVnode(oldStartVnode, newEndVnode)) {
        patch(oldStartVnode, newEndVnode);
        el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling); // 移动老的元素，老的元素就被移动走了，不用删除

        oldStartVnode = oldChildren[++oldStartIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVnode(oldEndVnode, newStartVnode)) {
        // 尾头比较
        patch(oldEndVnode, newStartVnode);
        el.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldChildren[--oldEndIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else {
        // 乱序比对   核心diff
        // 1.需要根据key和 对应的索引将老的内容生成程映射表
        let moveIndex = keysMap[newStartVnode.key]; // 用新的去老的中查找

        if (moveIndex == undefined) {
          // 如果不能复用直接创建新的插入到老的节点开头处
          el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
        } else {
          let moveNode = oldChildren[moveIndex];
          oldChildren[moveIndex] = null; // 此节点已经被移动走了

          el.insertBefore(moveNode.el, oldStartVnode.el);
          patch(moveNode, newStartVnode); // 比较两个节点的属性
        }

        newStartVnode = newChildren[++newStartIndex];
      }
    } // 如果用户追加了一个怎么办？  
    // 这里是没有比对完的


    if (newStartIndex <= newEndIndex) {
      for (let i = newStartIndex; i <= newEndIndex; i++) {
        // el.appendChild(createElm(newChildren[i]))  
        // insertBefore方法 他可以appendChild功能 insertBefore(节点,null)  dom api
        //  看一下为指针的下一个元素是否存在
        let anchor = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el;
        el.insertBefore(createElm(newChildren[i]), anchor);
      }
    }

    if (oldStartIndex <= oldEndIndex) {
      for (let i = oldStartIndex; i <= oldEndIndex; i++) {
        //  如果老的多 将老节点删除 ， 但是可能里面有null 的情况
        if (oldChildren[i] !== null) el.removeChild(oldChildren[i].el);
      }
    }
  } // 创建真实节点的


  function patchProps(vnode, oldProps = {}) {
    // 初次渲染时可以调用此方法，后续更新也可以调用此方法
    let newProps = vnode.data || {};
    let el = vnode.el; // 如果老的属性有，新的没有直接删除

    let newStyle = newProps.style || {};
    let oldStyle = oldProps.style || {};

    for (let key in oldStyle) {
      if (!newStyle[key]) {
        // 新的里面不存在这个样式
        el.style[key] = '';
      }
    }

    for (let key in oldProps) {
      if (!newProps[key]) {
        el.removeAttribute(key);
      }
    } // 直接用新的生成到元素上


    for (let key in newProps) {
      if (key === 'style') {
        for (let styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else {
        el.setAttribute(key, newProps[key]);
      }
    }
  }

  function createComponent$1(vnode) {
    let i = vnode.data; //  vnode.data.hook.init

    if ((i = i.hook) && (i = i.init)) {
      i(vnode); // 调用init方法
    }

    if (vnode.componentInstance) {
      // 有属性说明子组件new完毕了，并且组件对应的真实DOM挂载到了componentInstance.$el
      return true;
    }
  }

  function createElm(vnode) {
    let {
      tag,
      data,
      children,
      text,
      vm
    } = vnode;

    if (typeof tag === 'string') {
      // 元素
      if (createComponent$1(vnode)) {
        // 返回组件对应的真实节点
        return vnode.componentInstance.$el;
      }

      vnode.el = document.createElement(tag); // 虚拟节点会有一个el属性 对应真实节点

      patchProps(vnode);
      children.forEach(child => {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      const vm = this; // debugger

      vm.$el = patch(vm.$el, vnode);
    };

    Vue.prototype.$nextTick = nextTick;
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
      let vnode = vm._render();

      console.log('lifecycle----mountComponent----vnode----', vnode);

      vm._update(vnode);
    };

    callHook(vm, 'beforeMount');
    new Watcher(vm, updateComponent, () => {
      console.log('视图更新了！');
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
  // html字符串 =》 字符串  _c('div',{id:'app',a:1},'hello')

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
        let lastIndex = defaultTagRE.lastIndex = 0; // CSS-LOADER 原理一样

        while (match = defaultTagRE.exec(text)) {
          // 看有没有匹配到
          let index = match.index; // 开始索引

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
    let children = el.children; // 获取儿子

    if (children) {
      return children.map(c => gen(c)).join(',');
    }

    return false;
  }

  function generate(el) {
    //  _c('div',{id:'app',a:1},_c('span',{},'world'),_v())
    // 遍历树 将树拼接成字符串
    let children = genChildren(el);
    let code = `_c('${el.tag}',${el.attrs.length ? genProps(el.attrs) : 'undefined'}${children ? `,${children}` : ''})`; // console.log('generate---code---', code)

    return code;
  }

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名 

  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的

  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的 

  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
  //           aa  =   "  xxx "  | '  xxxx '  | xxx

  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'

  const startTagClose = /^\s*(\/?)>/; //     />   <div/>

  function parseHTML(html, options) {
    function advance(len) {
      html = html.substring(len);
    }

    function parseStartTag() {
      const start = html.match(startTagOpen);

      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);
        let end; // 如果没有遇到标签结尾就不停的解析

        let attr;

        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
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

      return false; // 不是开始标签
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

  // // 看一下用户是否传入了 , 没传入可能传入的是 template, template如果也没有传递
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
    const stack = [];
    parseHTML(template, {
      start(tagName, attributes) {
        let parent = stack[stack.length - 1];
        let element = createAstElement(tagName, attributes);

        if (!root) {
          root = element;
        }

        if (parent) {
          element.parent = parent; // 当放入栈中时 继续父亲是谁

          parent.children.push(element);
        }

        stack.push(element);
      },

      end(tagName) {
        let last = stack.pop();

        if (last.tag !== tagName) {
          throw new Error('标签有误');
        }
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
    let root = parse(template); // 生成代码 

    let code = generate(root);
    console.log('compileToFunction----code---', code);
    let render = new Function(`with(this){return ${code}}`); // code 中会用到数据 数据在vm上

    console.log('compiler----render----', render);
    return render; // render(){
    //     return
    // }
    // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom
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

  let uid = 0;
  function initMixin(Vue) {
    // console.log('initMixin----')
    Vue.prototype._init = function (options) {
      const vm = this;
      vm._uid = uid++;
      vm.$options = mergeOptions(vm.constructor.options, options); // console.log('init---vm.$options---', vm.$options)

      initLifecycle(vm);
      initEvents(vm);
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

  function createElement(vm, tag, data = {}, ...children) {
    // console.log('vdom---tag---data--', tag, data)
    if (isReservedTag(tag)) {
      return vnode(vm, tag, data, data.key, children, undefined);
    } else {
      const Ctor = vm.$options.components[tag];
      return createComponent(vm, tag, data, data.key, children, Ctor);
    }
  }

  function createComponent(vm, tag, data, key, children, Ctor) {
    console.log('vdom---createComponent---Ctor---', Ctor);

    if (isObject(Ctor)) {
      Ctor = vm.$options._base.extend(Ctor);
    }

    data.hook = {
      init(vnode) {
        // debugger
        let child = vnode.componentInstance = new Ctor({
          _isComponent: true,
          parent: vm
        }); // debugger

        child.$mount();
      }

    }; // console.log('vdom---createComponent---Ctor---', Ctor)
    // console.log(vnode(vm, `vue-component-${tag}`, data, key, undefined, undefined, {Ctor, children}))

    return vnode(vm, `vue-component-${tag}`, data, key, undefined, undefined, {
      Ctor,
      children
    });
  }

  function createTextElement(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  function vnode(vm, tag, data, key, children, text, componentOptions) {
    console.log('vnode----arguments---', arguments);
    return {
      vm,
      tag,
      data,
      key,
      children,
      text,
      componentOptions // .....

    };
  }

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
  }

  function renderMixin(Vue) {
    // console.log('renderMixin---')
    installRenderHelpers(Vue.prototype);

    Vue.prototype._render = function () {
      const vm = this;
      let render = vm.$options.render;
      let vnode = render.call(vm);
      return vnode;
    };
  }

  function initGlobalApi(Vue) {
    Vue.options = {};

    Vue.mixin = function (options) {
      this.options = mergeOptions(this.options, options); // console.log('initGlobal-----options----', this.options)

      return this;
    };

    Vue.options._base = Vue;
    Vue.options.components = {};

    Vue.component = function (id, definition) {
      definition = this.options._base.extend(definition); // console.log('global-api----component---definition---', definition)

      this.options.components[id] = definition;
    };

    Vue.extend = function (opts) {
      const Super = this;

      const Sub = function VueComponent(options) {
        this._init(options);
      };

      Sub.prototype = Object.create(Super.prototype);
      Sub.prototype.constructor = Sub;
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
