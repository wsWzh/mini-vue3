import { ElementTypes, NodeTypes } from "./ast";
import { capitalize } from '../utils'

//  with(ctx){} 作用域中的变量会在ctx里面查有的话相当于使用ctx.xxx
export function generate(ast) {
    const returns = traverseNode(ast)
    const code = `
    with(ctx){
        const {h,Text,Fragment,renderList,resolveComponent} = MiniVue
        return ${returns}
    }
    `
    return code
}

function traverseNode(node, parent) {
    switch (node.type) {
        case NodeTypes.ROOT:
            if (node.children.length === 1) {
                return traverseNode(node.children[0], node)//根节点
            }
            return traverseChildren(node)
        case NodeTypes.ELEMENT:
            return resolveElementASTNode(node, parent)
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
function resolveElementASTNode(node, parent) {
    // v-if="ok" => ok?h('div):h('text',null,'')
    const ifNode = pluck(node.directives, 'if', true) || pluck(node.directives,'else-if',true)
    if (ifNode) {
        const { exp } = ifNode
        let conditin = exp.content//ok 条件
        let consequent = resolveElementASTNode(node, parent)//这里可能有别的指令例如v-if和v-for在同一个节点 所以要递归
        let alternate = createTextVNode()

        // 如果有ifNode，则需要看它的下一个元素节点是否有else-if或else
        const { children } = parent
        let i = children.findIndex(child => child === node) + 1//下一个兄弟节点判断是不是空文本节点

        // <div v-if="ok"/> <p v-else-if="no"/> <span v-else/>
        // 为了处理上面的例子，需要将空节点删除
        // 也因此，才需要用上for循环
        for (; i < children.length; i++) {
            const sibling = children[i]
            if (sibling.type === NodeTypes.TEXT && !sibling.content.trim()){
                children.splice(i, 1)
                i--
                continue
            }
            if(sibling.type==NodeTypes.ELEMENT){
                if(pluck(sibling.directives,'else',true)){
                    //v-else
                    alternate = resolveElementASTNode(sibling,parent)
                    children.splice(i, 1)//在alternate已经渲染了 要删掉
                }if(pluck(sibling.directives,'else-if',false)){
                    // 这里先不删掉 递归后再删除
                    alternate = resolveElementASTNode(sibling, parent)
                    children.splice(i, 1)
                }
            }
            // 只用向前寻找一个相临的元素，因此for循环到这里可以立即退出
            break
        }
        return `${conditin} ? ${consequent} : ${alternate}`
    }

    // v-for
    const forNode = pluck(node.directives, 'for', true)
    if (forNode) {
        const { exp } = forNode
        const [args, source] = exp.content.split(/\sin\s/ || /\sof\s/)
        return `h(Fragment,null,renderList(${source.trim()},${args.trim()} => ${resolveElementASTNode(node, parent)}))`
    }
    return createElementVNode(node)
}

function createElementVNode(node) {
    const { children ,tagType} = node
    //stringify加冒号 组件是对象不能string化
    const tag =tagType===ElementTypes.ELEMENT? `'${node.tag}'`:`resolveComponent('${node.tag}')`
    // h('div')
    //h(Com) 渲染组件Com是个对象
    const vModel=pluck(node.directives,'model',true)
    if (vModel){
        node.directives.push({
            type:NodeTypes.DIRECTIVE,
            name:'bind',
            exp:vModel.exp,
            arg:{
                type:NodeTypes.SIMPLE_EXPRESSION,
                content:'value',
                isStatic:true
            }
        },{
            type:NodeTypes.DIRECTIVE,
            name:'on',
            exp:{
                type:NodeTypes.SIMPLE_EXPRESSION,
                content:`($event)=>${vModel.exp.content}=$event.target.value`,
            },
            arg:{
                type:NodeTypes.SIMPLE_EXPRESSION,
                content:'input',
                isStatic:true
            }
        })
    }
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
        const result = traverseNode(child, node)//递归
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