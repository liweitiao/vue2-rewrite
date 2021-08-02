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
          console.log('observer---key---dep2---', key, dep);
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
      return createElm(vnode);
    }

    if (oldVnode.nodeType == 1) {
      const parentElm = oldVnode.parentNode;
      let elm = createElm(vnode); // console.log('patch----elm---', elm)

      parentElm.insertBefore(elm, oldVnode.nextSibling);
      parentElm.removeChild(oldVnode);
      return elm;
    }
  }

  function createComponent$1(vnode) {
    let i = vnode.data;

    if ((i = i.hook) && (i = i.init)) {
      i(vnode);
    }

    if (vnode.componentInstance) {
      return true;
    }
  }

  function createElm(vnode) {
    // console.log('patch----vnode---', vnode)
    let {
      tag,
      data,
      children,
      text,
      vm
    } = vnode;

    if (typeof tag === 'string') {
      if (createComponent$1(vnode)) {
        return vnode.componentInstance.$el;
      } // debugger


      vnode.el = document.createElement(tag);
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
      let vnode = vm._render(); // console.log('lifecycle----mountComponent----vnode----', vnode)


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
    let code = `_c('${el.tag}',${el.attrs.length ? genProps(el.attrs) : 'undefined'}${children ? `,${children}` : ''})`;
    return code;
  }

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名 

  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的

  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的 

  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
  //           aa  =   "  xxx "  | '  xxxx '  | xxx

  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'

  const startTagClose = /^\s*(\/?)>/; //     />   <div/>

  function parserHTML(html) {
    // ast (语法层面的描述 js css html) vdom （dom节点）
    // html字符串解析成 对应的脚本来触发 tokens  <div id="app"> {{name}}</div>
    // 将解析后的结果 组装成一个树结构  栈
    function createAstElement(tagName, attrs) {
      return {
        tag: tagName,
        type: 1,
        children: [],
        parent: null,
        attrs
      };
    }

    let root = null;
    let stack = [];

    function start(tagName, attributes) {
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
    }

    function end(tagName) {
      let last = stack.pop();

      if (last.tag !== tagName) {
        throw new Error('标签有误');
      }
    }

    function chars(text) {
      text = text.replace(/\s/g, "");
      let parent = stack[stack.length - 1];

      if (text) {
        parent.children.push({
          type: 3,
          text
        });
      }
    }

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
      // 看要解析的内容是否存在，如果存在就不停的解析
      let textEnd = html.indexOf('<'); // 当前解析的开头  

      if (textEnd == 0) {
        const startTagMatch = parseStartTag(); // 解析开始标签

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }

        const endTagMatch = html.match(endTag);

        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }
      }

      let text; // //  </div>

      if (textEnd > 0) {
        text = html.substring(0, textEnd);
      }

      if (text) {
        chars(text);
        advance(text.length);
      }
    }

    return root;
  } // 看一下用户是否传入了 , 没传入可能传入的是 template, template如果也没有传递
  // 将我们的html =》 词法解析  （开始标签 ， 结束标签，属性，文本）
  // => ast语法树 用来描述html语法的 stack=[]
  // codegen  <div>hello</div>  =>   _c('div',{},'hello')  => 让字符串执行
  // 字符串如果转成代码 eval 好性能 会有作用域问题
  // 模板引擎 new Function + with 来实现

  function compileToFunction(template) {
    let root = parserHTML(template); // 生成代码 

    let code = generate(root);
    let render = new Function(`with(this){return ${code}}`); // code 中会用到数据 数据在vm上

    return render; // render(){
    //     return
    // }
    // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom
  }

  function initProvide(vm) {
    const provide = vm.$options.provide;
    console.log('inject----provide--', provide);

    if (provide) {
      vm._provided = typeof provide === 'function' ? provide.call(vm) : provide;
    }
  }
  function initInjections(vm) {
    const result = resolveInject(vm.$options.inject, vm);
    console.log('inject---initInjections---result---', result);

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

      const keys = Reflect.ownKeys(inject);
      console.log('inject----resolveInject----result---', keys);

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
          console.log('inject---key---', inject, key);

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
    // console.log('vdom---createComponent---Ctor---', Ctor)
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

  function renderMixin(Vue) {
    // console.log('renderMixin---')
    Vue.prototype._c = function () {
      return createElement(this, ...arguments);
    };

    Vue.prototype._v = function (text) {
      return createTextElement(this, text);
    };

    Vue.prototype._s = function (val) {
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    };

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
