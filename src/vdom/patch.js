
export function patch(oldVnode, vnode) {

  if (!oldVnode) {
    return createElm(vnode)
  }

  if (oldVnode.nodeType == 1) {
    const parentElm = oldVnode.parentNode
    let elm = createElm(vnode)
    // console.log('patch----elm---', elm)
    parentElm.insertBefore(elm, oldVnode.nextSibling)
    parentElm.removeChild(oldVnode)

    return elm
  }
}

function createComponent(vnode) {
  let i = vnode.data
  if ((i = i.hook) && (i = i.init)) {
    i(vnode)
  }
  if (vnode.componentInstance) {
    return true
  }
}

function createElm(vnode) {
  // console.log('patch----vnode---', vnode)
  let { tag, data, children, text, vm } = vnode
  if (typeof tag === 'string') {
    if (createComponent(vnode)) {
      return vnode.componentInstance.$el
    }

    // debugger
    vnode.el = document.createElement(tag)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}