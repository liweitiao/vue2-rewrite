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