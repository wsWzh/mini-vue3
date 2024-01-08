import {typeOf} from '../utils'

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
 * @param {string | Array | null} children
 * @return VNode
 */
export function h(type,props,children){
    let shapeFlag = 0
    if(typeOf(type,'string')){
        shapeFlag=ShapeFlags.ELEMENT
    } else if (type=== Text){
        shapeFlag = ShapeFlags.TEXT
    }else if(type===Fragment){
        shapeFlag = ShapeFlags.FRAGMENT
    }else{
        shapeFlag = ShapeFlags.COMPONENT//组件
    }

    if (typeOf(children, 'string') || typeOf(children,'number'))

    return {
        type,
        props,
        children,
        shapeFlag
    }
}