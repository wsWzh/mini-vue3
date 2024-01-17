import { effect, reactive } from "../reactivity"
import { normalizeVNode } from "./vnode"
import { queueJob } from "./scheduler"
import { compile } from '../compiler'

function updateProps(instance, vnode) {
    const { type: Component, props: vnodeProps } = vnode

    const props = (instance.props = {})
    const attrs = (instance.attrs = {})
    for (const key in vnodeProps) {
        if (Component.props?.includes(key)) {
            props[key] = vnodeProps[key]
        } else {
            attrs[key] = vnodeProps[key]
        }
    }
    instance.props = reactive(instance.props)//响应式 修改props也要触发更新
}

function fallThrough(instance, subTree) {
    if (Object.keys(instance.attrs).length) {
        // 继承attrs
        subTree.props = { ...subTree.props, ...instance.attrs }
    }
}

export function mountComponent(vnode, container, anchor, patch) {

    const { type: Component } = vnode

    //状态组件 实例
    const instance = (vnode.component = {
        props: {},
        attrs: {},
        setupState: null,
        ctx: null,
        subTree: null,//记录第一次挂载的结果 用于更新时比对
        isMount: false,//是否已经挂载
        mount: null,
        update: null,//组件更新
        next: null,//存储n2 组件更新时，把新vnode暂放在这里
    })

    updateProps(instance, vnode)

    instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs })

    // 传入render函数中的参数 能访问 props和setup返回的属性
    instance.ctx = {
        ...instance.props,
        ...instance.setupState,
    }

    if (!Component.render && Component.template) {
        let { template } = Component
        if (template[0] === '#') {
            const el = document.querySelector(template)
            template = el ? el.innerHTML : ''
        }
        const code = compile(template)
        Component.render = new Function('ctx', code)
    }

    //effect 默认执行一次 代替mount
    instance.update = effect(() => {
        if (!instance.isMount) {
            //挂载
            // 返回不一定是标准的vnode 对不同类型的返回进行处理
            const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)))
            fallThrough(instance, subTree)

            patch(null, subTree, container, anchor)

            vnode.el = subTree.el

            instance.isMount = true
        } else {
            //更新
            // instance.next存在，代表是被动更新。否则是主动更新
            if (instance.next) {
                vnode = instance.next
                instance.next = null//防止影响主动更新
                updateProps(instance, vnode)
                instance.ctx = {
                    ...instance.props,
                    ...instance.setupState,
                }
            }

            const prev = instance.subTree

            // 返回不一定是标准的vnode 对不同类型的返回进行处理
            const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)))

            fallThrough(instance, subTree)

            patch(prev, subTree, container, anchor)
            vnode.el = subTree.el
        }

    }, { scheduler: queueJob })

}