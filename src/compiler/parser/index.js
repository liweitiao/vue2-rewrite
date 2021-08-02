
// // 看一下用户是否传入了 , 没传入可能传入的是 template, template如果也没有传递
// // 将我们的html =》 词法解析  （开始标签 ， 结束标签，属性，文本）
// // => ast语法树 用来描述html语法的 stack=[]

// // codegen  <div>hello</div>  =>   _c('div',{},'hello')  => 让字符串执行
// // 字符串如果转成代码 eval 好性能 会有作用域问题

// // 模板引擎 new Function + with 来实现

import { parseHTML } from './html-parser'

export function createAstElement(tagName, attrs) {
    return {
        tag: tagName,
        type: 1,
        children: [],
        parent: null,
        attrs
    }
}

export function parse(template, options) {
    let root
    const stack = []
    parseHTML(template, {
         start(tagName, attributes) {
            let parent = stack[stack.length - 1];
            let element = createAstElement(tagName, attributes);
            if (!root) {
                root = element;
            }
            if (parent) {
                element.parent = parent; // 当放入栈中时 继续父亲是谁
                parent.children.push(element)
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
                })
            }
        }
    })

    return root
}

