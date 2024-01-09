import { ShapeFlags } from "./vnode"

export function render(vnode, container) {
    mount(vnode, container)
}

function mount(vnode, container) {
    const { shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.ELEMENT) {
        mountElement(vnode, container)
    }else if (shapeFlag & ShapeFlags.TEXT) {
        mountTextNode(vnode, container)
        console.log('TEXT', vnode);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        mountFragment(vnode, container)
    }else{
        mountComponent(vnode, container)
    }
}

function mountElement(vnode, container){
    const {type,props}=vnode
    const el=document.createElement(type)
    mountProps(props,el)
    mountChildren(vnode,el)
    container.appendChild(el)
}

function mountTextNode(vnode, container) {
    const textNode=document.createTextNode(vnode.children)
    container.appendChild(textNode)
}

// 不渲染的节点 例如template
function mountFragment(vnode, container) {
    mountChildren(vnode, container)
}

function mountComponent(vnode, container){

}

function mountChildren(vnode, container){
    const { shapeFlag,children } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN){
        mountTextNode(vnode, container)
    }if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
        children.forEach(item=>{
            mount(item,container)
        })
    }
}

// 匹配有大写或者value,checked,selected,muted,disabled属性
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/
function mountProps(props, el) {
    for (const key in props) {
        let val = props[key]
        switch(key){
            case 'class':
                el.className=val
                break
            case 'style':
                for (const styleName in val) {
                    el.style[styleName]=val[styleName]
                }
                break
            default:
                //处理事件 [^a-z] 不能a-z 匹配onClick
                if(/^on[^a-z]/.test(key)){

                    const eventName=key.slice(2).toLowerCase()
                    el.addEventListener(eventName, val)
                }
                // 处理html标签上标准属性
                if (domPropsRE.test(key)){
                    //{'checked:''} <input type='checked' checked/> 这种情况应该是true
                    if(val===''&&typeof el[key]==='boolean'){
                        val=true
                    }
                    // 标准属性可以直接设置值
                    el[key]=val
                }else{
                    // 会设置成字符串的false 还会被识别为true 所以要移除这个属性
                    if(val==null || val===false){
                        el.removeAttribute(key)
                    }else{
                        // 处理自定义属性 例如<input type='checked' custom=123/>
                        el.setAttribute(key, val)
                    }
                }
                break
        }
    }
}
