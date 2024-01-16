import { NodeTypes } from "./ast";
import { capitalize } from '../utils'

//  with(ctx){} 作用域中的变量会在ctx里面查有的话相当于使用ctx.xxx
export function generate(ast) {
    const returns = traverseNode(ast)
    const code = `
    with(ctx){
        const {h,Text,Fragment} = MiniVue
        return ${returns}
    }
    `
    return code
}

function traverseNode(node) {
    switch (node.type) {
        case NodeTypes.ROOT:
            if (node.children.length === 1) {
                return traverseNode(node.children[0])
            }
            const result = traverseChildren(node)
            return result
        case NodeTypes.ELEMENT:
            return resolveElementASTNode(node)
        case NodeTypes.INTERPOLATION:
            return createTextVNode(node.content)
        case NodeTypes.TEXT:
            return createTextVNode(node)
    }
}

function createTextVNode(node) {
    const child = createText(node)
    return `h(Text,null,${child})`
}

function createText({ isStatic = true, content = '' } = {}) {
    return isStatic ? JSON.stringify(content) : content
}

// 专门处理特殊指令
function resolveElementASTNode(node) {
    const forNode = pluck(node.directives, 'for')
    if (forNode) {
        const { exp } = forNode
        const [args, source] = exp.content.split(/\sin\s/ || /\sof\s/)
        return `h(Tragment,null,renderList(${source.trim()},${args.trim()} => ${createElementVNode(node)}))`
    }
    return createElementVNode(node)
}

function createElementVNode(node) {
    const { children } = node
    const tag = JSON.stringify(node.tag)//stringify加冒号

    const propArr = createPropArr(node)
    const propStr = propArr ? `{${propArr.join(',')}}` : null

    if (!children) {
        if (propStr === 'null') {
            return `h(${tag})`
        }
        return `h(${tag},${propStr})`
    }
    let childrenStr = traverseChildren(node)
    return `h(${tag},${propStr},${childrenStr})`
}

function createPropArr(node) {
    const { props, directives } = node
    return [
        ...props.map(prop => `${prop.name}:${createText(prop.value)}`),
        ...directives.map(dir => {
            switch (dir.name) {
                case 'bind':
                    return `${dir.arg.content}:${createText(dir.exp)}`
                case 'on':
                    const eventName = `on${capitalize(dir.arg.content)}`
                    let exp = dir.exp.content
                    // 判断是否以)结尾 中间可以是除了)的任意字符 *匹配0或多次 并且不包含=>
                    if (/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
                        exp = `$event=>(${exp})`
                    }
                    return `${eventName}:${exp}`
                case 'html':
                    return `innerHtml:${createText(dir.exp)}`
                default:
                    return `${dir.name}:${createText(dir.exp)}`
            }
        })
    ]
}

function traverseChildren(node) {
    const { children } = node
    if (children.length === 1) {
        const child = children[0]
        if (child.type === NodeTypes.TEXT) {
            return createText(child)
        }
        if (child.type === NodeTypes.INTERPOLATION) {
            return createText(child.content)
        }
    }

    const results = []
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const result = traverseNode(child)//递归
        results.push(result)
    }
    return `[${results.join(',')}]`
}

function pluck(directives, name, remove = true) {
    const index = directives.findIndex(dir => dir.name === name)
    const dir = directives[index]
    if (index > -1 && remove) {
        directives.splice(index, 1)
    }
    return dir
}