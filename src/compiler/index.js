import { generate } from './codegen/index';
import {parse} from './parser/index';

export function compileToFunction(template) {
    let root = parse(template)
    // console.log('compiler----root----', root)
    // 生成代码 
    let code = generate(root)
    // console.log('compiler----code---', code)
    let render = new Function(`with(this){return ${code}}`); // code 中会用到数据 数据在vm上
    // console.log('compiler----render----', render)
    return render;
    // render(){
    //     return
    // }
    // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom
}
