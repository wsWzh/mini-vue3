import { typeOf } from "../../utils";

export function renderList(source, renderItem) {
    // source 可以是对象,数组,数字,字符串
    //(value,key,index) in source 对象特殊处理
    const nodes = []
    if (typeOf(source, 'number')) {
        for (let i = 0; i < source; i++) {
            nodes.push(renderItem(i + 1, i))
        }
    } else if (typeOf(source, 'array') || typeOf(source, 'string')) {
        for (let i = 0; i < source.length; i++) {
            nodes.push(renderItem(source[i], i))
        }
    } else if (typeOf(source, 'object')) {
        const keys=Object.keys(source)
        keys.forEach((key,index)=>{
            nodes.push(renderItem(source[key], key, index))
        })
    }
    return nodes
}