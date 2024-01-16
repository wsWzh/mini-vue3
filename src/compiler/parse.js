import { NodeTypes, ElementTypes, createRoot } from "./ast";
import { isNativeTag, isVoidTag } from './index'
import { camelize } from '../utils'

//接收模板字符串
export function parse(content) {
    const context = creatrParserContext(content)
    const children = parseChildren(context)
    return createRoot(children)
}

function creatrParserContext(content) {
    return {
        options: {
            delimiters: ['{{', '}}'],
            isNativeTag,//放在options里面方便跨平台 方便扩展
            isVoidTag
        },
        source: content,//模板字符串
    }
}

function parseChildren(context) {
    const nodes = []
    while (!isEnd(context)) {
        const s = context.source
        let node
        if (s.startsWith(context.options.delimiters[0])) {
            //处理插值语法
            node = parseInterpolation(context)
        } else if (s[0] === '<') {
            // 处理html标签
            node = parseElement(context)
        } else {
            //处理文本节点
            node = parseText(context)
        }
        nodes.push(node)
    }
    let removeWhiteSpace = false
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        // 处理文本节点
        if (node.type === NodeTypes.TEXT) {
            // 区分文本节点是否全是空白 匹配非[]里的值[^]
            if (/[^\t\r\f\n ]+/.test(node.content)) {
                // 文本节点有一些字符
                node.content = node.content.replace(/[\t\r\f\n ]/g, ' ')//去除多余空白
            } else {
                // 文本节点全是空白
                const prev = node[i - 1]
                const next = node[i + 1]
                if (!prev || !next || (prev.type !== NodeTypes.TEXT && next.type !== NodeTypes.TEXT && /[\r\n]/.test(prev.content))) {
                    // 删除空白节点 这里不能直接删除不然i会变
                    node[i] = null
                    removeWhiteSpace = true
                } else {
                    // 替换成空格
                    node.content = ' '
                }
            }
        }
    }
    return removeWhiteSpace ? nodes.filter(node => node !== null) : nodes
}

// 缺陷:不支持文本节点中带<
// a<b纯文本 会在<截断
// 遇到</会直接结束
function parseText(context) {
    const endTokens = ['<', context.options.delimiters[0]]//结束标识
    let endIndex = context.source.length//匹配结束标识中的最小长度

    for (let i = 0; i < endTokens.length; i++) {
        let index = context.source.indexOf(endTokens[i])
        if (index != -1 && index < endIndex) {
            endIndex = index
        }
    }
    const content = parseTextData(context, endIndex)
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context, length) {
    const text = context.source.slice(0, length)
    advanceBy(context, length)
    return text
}

//{{name}}
function parseInterpolation(context) {
    const [open, close] = context.options.delimiters

    advanceBy(context, open.length)//吃掉{{ 剩下name}}

    const closeIndex = context.source.indexOf(close)

    const content = parseTextData(context, closeIndex).trim()//吃掉name并且去掉两端空格 剩下}}

    advanceBy(context, close.length)//吃掉}} 结束

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
            isStatic: false,
        },
    }
}

function parseElement(context) {
    const element = parseTag(context)//标签开始
    if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
        return element //自闭合标签直接返回 <input> 这种没有/>也是自闭合
    }
    element.children = parseChildren(context)

    parseTag(context)//标签结束 这里上面已经判断不是自闭合了

    return element
}

function parseTag(context) {
    //匹配<或者</开头 首位为a-z后续不是空白符或者标签结束符合
    const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
    const tag = match[1]

    advanceBy(context, match[0].length)

    advanceSpaces(context)//吃掉空格 <div   id=xxx

    const { props, directives } = parseAttributes(context)//获取props 指令
    const isSelfClosing = context.source.startsWith('/>')
    advanceBy(context, isSelfClosing ? 2 : 1)

    const tagType = isComponent(tag, context) ? ElementTypes.COMPONENT : ElementTypes.ELEMENT

    return {
        type: NodeTypes.ELEMENT,
        tag, // 标签名,
        tagType, // 是组件还是原生元素,
        props, // 属性节点数组,
        directives, // 指令数组
        isSelfClosing, // 是否是自闭合标签,
        children: [],
    };
}

function isComponent(tag, context) {
    return !context.options.isNativeTag(tag)
}

function parseAttributes(context) {
    const props = []
    const directives = []
    while (context.source.length && !context.source.startsWith('>') && !context.source.startsWith('/>')) {
        let attr = parseAttribute(context)
        if (attr.type === NodeTypes.DIRECTIVE) {
            directives.push(attr)
        } else {
            props.push(attr)
        }
    }
    return { props, directives }
}

function parseAttribute(context) {
    // name=value 或者 <div id>没有value
    // 第一位除了空白符 匹配到了空白符和=号时结束
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    const name = match[0]
    advanceBy(context, name.length)
    advanceSpaces(context)
    let value
    if (context.source[0] === '=') {
        advanceBy(context, 1)
        advanceSpaces(context)
        value = parseAttributeValue(context)
        advanceSpaces(context)
    }

    //directive
    if (/^(:|@|v-)/.test(name)) {
        let dirName, argContent
        if (name[0] === ':') {
            dirName = 'bind'
            argContent = name.slice(1)
        } else if (name[0] === '@') {
            dirName = 'on'
            argContent = name.slice(1)
        } else if (name.startsWith('v-')) {
            [dirName, argContent] = name.slice(2).split(':')
        }
        return {
            type: NodeTypes.DIRECTIVE,
            name: dirName,
            // 表达式
            exp: value && {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: value.content,
                isStatic: false
            },
            // v-on:click=myClick
            // on指令名 click指令内容 myClick表达式
            arg: argContent && {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: camelize(argContent),
                isStatic: true
            }
        }
    }

    //attribute
    return {
        type: NodeTypes.ATTRIBUTE,
        name,
        value: value && {
            type: NodeTypes.TEXT,
            content: value.content
        },
    }
}

function parseAttributeValue(context) {
    //   value可能是"或者'
    const quote = context.source[0]//拿到引号
    advanceBy(context, 1)//吃掉引号头
    const endIndex = context.source.indexOf(quote)
    const content = parseTextData(context, endIndex)
    advanceBy(context, 1)//吃掉引号尾
    return { content }
}

function isEnd(context) {
    const s = context.source
    // 遇到</也代表结束
    return s.startsWith('</') || !s
}

function advanceBy(context, numberOfCharacters) {
    context.source = context.source.slice(numberOfCharacters)
}

// 吃掉空格
function advanceSpaces(context) {
    // 匹配空格换行 +出现一次以上
    const match = /^[\t\r\n\f ]+/.exec(context.source)
    if (match) {
        advanceBy(context, match[0].length)
    }
}