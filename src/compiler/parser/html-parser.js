
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名 
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的 
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
//           aa  =   "  xxx "  | '  xxxx '  | xxx
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'
const startTagClose = /^\s*(\/?)>/; //     />   <div/>
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}

export function parseHTML(html, options) {

  function advance(len) {
    html = html.substring(len);
  }

  function parseStartTag() {
      const start = html.match(startTagOpen);
      if (start) {
          const match = {
              tagName: start[1],
              attrs: []
          }
          advance(start[0].length);
          let end;
          // 如果没有遇到标签结尾就不停的解析
          let attr;

          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
              match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] })
              advance(attr[0].length)
          }
          if (end) {
              advance(end[0].length);
          }
          return match;
      }
      return false; // 不是开始标签
  }

  while (html) {
    let textEnd = html.indexOf('<')
    if (textEnd == 0) {
      const startTagMatch = parseStartTag(html)
      // debugger
      if (startTagMatch) {
          options.start(startTagMatch.tagName, startTagMatch.attrs)
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
        text = html.substring(0, textEnd)
    }
    if (text) {
        options.chars(text);
        advance(text.length);
    }
  }
}