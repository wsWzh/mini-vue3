import { typeOf } from '../utils'

export const ShapeFlags = {
    ELEMENT: 1, // 00000001
    TEXT: 1 << 1, // 00000010
    FRAGMENT: 1 << 2, // 00000100
    COMPONENT: 1 << 3, // 00001000
    TEXT_CHILDREN: 1 << 4, // 00010000
    ARRAY_CHILDREN: 1 << 5, // 00100000
    CHILDREN: (1 << 4) | (1 << 5), //00110000
};

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

/**
 *
 * @param {string | Object | Text | Fragment} type
 * @param {Object | null} props
 * @param {string | number | Array | null} children
 * @return VNode
 */
export function h(type, props, children) {
    let shapeFlag = 0
    if (typeOf(type, 'string')) {
        shapeFlag = ShapeFlags.ELEMENT
    } else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT
    } else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT
    } else {
        shapeFlag = ShapeFlags.COMPONENT//组件
    }

    if (typeOf(children, 'string') || typeOf(children, 'number')) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN
        children = children.toString()
    } else if (typeOf(children, 'array')) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    }

    return {
        type,
        props,
        children,
        shapeFlag,
        el: null,//对应的真实dom 删除节点要用到
        anchor: null,//记录FRAGMENT insertBefore的位置 不然patch时会添加到末尾
        key:props&&props.key,//key的作用是更新时判断是否是同一个节点
        component:null,//存储组件实例
    }
}

export function normalizeVNode(result){
    // 数组添加一个的根节点
    if(typeOf(result, 'array')){
        return h(Fragment,null,result)
    }
    // 对象说明是标准vnode
    if(typeOf(result, 'object')){
        return result
    }
    // 字符串或者数字
    return h(Text,null,result.toString())
}