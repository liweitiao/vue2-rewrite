export function addAttr (el, name, value, dynamic) {
  const attrs = dynamic
    ? (el.dynamicAttrs || (el.dynamicAttrs = []))
    : (el.attrs || (el.attrs = []))
  attrs.push({ name, value, dynamic })
  el.plain = false
}