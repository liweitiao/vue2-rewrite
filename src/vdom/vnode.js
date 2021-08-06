export default class VNode {
  constructor(context, tag, data, key, children, text, componentOptions) {
    this.context = context
    this.tag = tag
    this.data = data
    this.key = key
    this.children = children
    this.text = text
    this.componentOptions = componentOptions
  }
}

export const createEmptyVNode = (text) => {
  const node = new VNode()
  node.text = text
  node.isComment = true

  return node
}