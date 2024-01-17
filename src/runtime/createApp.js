import { camelize, capitalize, typeOf } from '../utils'
import { h, render } from './index'

let components;
export function createApp(rootComponent) {
    components = rootComponent.components || {};
    const app = {
        mount(rootContainer) {
            if (typeOf(rootContainer, 'string')) {
                rootContainer = document.querySelector(rootContainer)
            }
            // 没有render,template属性 说明是写在template标签里
            if (!rootContainer.rendr && !rootContainer.template) {
                rootComponent.template = rootContainer.innerHTML
            }
            rootContainer.innerHTML = ''//清空避免渲染多次
            render(h(rootComponent), rootContainer)
        }
    }

    return app
}

export function resolveComponent(name) {
    return components && (components[name] || components[camelize(name)] || components[capitalize(camelize(name))])
}

// tree-item treeItem TreeItem支持组件三种写法