import { effect, reactive } from "../reactivity"
import { normalizeVNode } from "./vnode"

function initProps(instance, vnode) {
    const { type: Component, props: vnodeProps } = vnode

    const props = instance.props = {}
    const attrs = instance.attrs = {}

    for (const key in vnodeProps) {
        if (Component.props?.includes(key)) {
            props[key] = vnodeProps[key]
        } else {
            attrs[key] = vnodeProps[key]
        }
    }
    instance.props = reactive(instance.props)//响应式 修改props也要触发更新
}

export function mountComponent(vnode, container, anchor, patch) {

    const { type: Component } = vnode

    //状态组件 实例
    const instance = {
        props: null,
        attrs: null,
        setupState: null,
        ctx: null,
        subTree: null,//记录第一次挂载的结果 用于更新时比对
        isMount:false,//是否已经挂载
        mount: null,
        update: null,//组件更新
    }

    initProps(instance, vnode)

    instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs })

    // 传入render函数中的参数 能访问 props和setup返回的属性
    instance.ctx = {
        ...instance.props,
        ...instance.setupState,
    }

    instance.mount = () => {

    }

    instance.mount()

    //effect 默认执行一次 代替mount
    instance.update =effect(() => {
        if(!instance.isMount){
            //挂载
            // 返回不一定是标准的vnode 对不同类型的返回进行处理
            const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)))

            if (Object.keys(instance.attrs).length) {
                // 继承attrs
                subTree.props = { ...subTree.props, ...instance.attrs }
            }

            patch(null, subTree, container, anchor)
            instance.isMount = true
        }else{
            //更新
            const prev = instance.subTree
            console.log('更新', prev);
            // 返回不一定是标准的vnode 对不同类型的返回进行处理
            const subTree = normalizeVNode(Component.render(instance.ctx))

            if (Object.keys(instance.attrs).length) {
                // 继承attrs
                subTree.props = { ...subTree.props, ...instance.attrs }
            }

            patch(prev, subTree, container, anchor)
        }

    })


}