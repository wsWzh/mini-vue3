import { ShapeFlags } from "./vnode"
import { patchProps } from './patchProps'


export function render(vnode, container) {
    const prevVnode = container._vnode
    if (!vnode) {
        if (prevVnode) {
            unmount(prevVnode)
        }
    } else {
        patch(prevVnode, vnode, container)
    }
    container._vnode = vnode
}

function unmount(vnode) {
    const { shapeFlag, el } = vnode
    if (shapeFlag & ShapeFlags.COMPONENT) {
        unmountComponent(vnode)
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        unmountFragment(vnode)
    } else {
        //element text 类型
        el.parentNode.removeChild(el)
    }
}

function unmountComponent(vnode) {

}

function unmountChildren(children) {
    children.forEach(item => {
        unmount(item)
    })
}

function unmountFragment(vnode) {
    let { el: cur, anchor: end } = vnode
    const { parentNode } = cur
    // 循环删除
    while (cur !== end) {
        let next = cur.nextSibling
        parentNode.removeChild(cur)
        cur = next
    }
    // 删除最后一个
    parentNode.removeChild(end)
}

function processComponent(n1, n2, container, anchor) {

}

function processText(n1, n2, container, anchor) {
    if (n1) {
        n2.el = n1.el
        n1.el.textContent = n2.children
    } else {
        mountTextNode(n2, container, anchor)
    }
}

function processFragment(n1, n2, container, anchor) {
    // 对于fragment元素的children前后添加空的文字节点作为el和anchor
    const fragmentStartAnchor = (n2.el = n1 ? n1.el : document.createTextNode(''))
    const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : document.createTextNode(''))
    if (n1) {
        patchChildren(n1, n2, container, fragmentEndAnchor)
    } else {
        container.insertBefore(fragmentStartAnchor, anchor)//插入后才mountChildren记录patch的位置
        container.insertBefore(fragmentEndAnchor, anchor)//插入后才mountChildren记录patch的位置
        mountChildren(n2.children, container, fragmentEndAnchor)
    }
}

function patch(n1, n2, container, anchor) {
    if (n1 && !isSameVNode(n1, n2)) {
        anchor = (n1.anchor || n1.el).nextSibling//下一个兄弟节点
        unmount(n1) //删除时重设anchor
        n1 = null
    }
    const { shapeFlag } = n2
    if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.TEXT) {
        processText(n1, n2, container, anchor)
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
        processFragment(n1, n2, container, anchor)
    } else {
        //patch 子节点
        processElement(n1, n2, container, anchor)
    }
}

function isSameVNode(n1, n2) {
    return n1.type === n2.type
}




function processElement(n1, n2, container, anchor) {
    if (n1) {
        patchElement(n1, n2)
    } else {
        mountElement(n2, container, anchor)
    }
}

function mountTextNode(vnode, container, anchor) {

    const textNode = document.createTextNode(vnode.children)
    console.log(container, vnode.children, textNode);
    container.insertBefore(textNode, anchor)
    vnode.el = textNode//删除节点要用到
}

function mountElement(vnode, container, anchor) {
    const { type, props, shapeFlag, children } = vnode
    const el = document.createElement(type)

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, el)
    } if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 这里不用传anchor，因为这里的el是新建的，anchor等同于最后一个
        mountChildren(children, el)
    }
    if (props) {
        patchProps(null, props, el)
    }
    //对于FRAGMENT 子元素从空数组变成有值数组 会添加到父元素的末尾 不会添加到FRAGMENT在n1时的位置
    // container.appendChild(el)
    // 新增anchor属性解决FRAGMENT patch时添加到末尾的问题
    container.insertBefore(el, anchor)
    vnode.el = el//删除节点要用到
}

function mountChildren(children, container, anchor) {
    children.forEach(item => {
        patch(null, item, container, anchor)
    })//n1是null相当于mount
}

// patchElement不需要anchor
function patchElement(n1, n2) {
    n2.el = n1.el
    // 更新属性
    patchProps(n1.props, n2.props, n2.el)
    patchChildren(n1, n2, n2.el)
}

function patchChildren(n1, n2, container, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // n1 n2都是text类型
            if (c1 !== c2) {
                container.textContent = c2.textContent
            }
        } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //n1是数组 n2是text
            unmountChildren(c1)
            container.textContent = c2.textContent
        } else {
            //n1是null n2是text
            container.textContent = c2.textContent
        }
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // n1是text n2是数组
            container.textContent = ''
            mountChildren(c2, container, anchor)
        } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // n1 n2都是数组
            patchArrayChildren(c1, c2, container, anchor)
        } else {
            //n1是null ,n2是数组
            mountChildren(c2, container, anchor)
        }
    } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            //n1是text n2是null
            container.textContent = ''
        } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            //n1是数组 n2是null
            unmountChildren(c1)
        } else {
            //n1 n2都是null
            //不处理
        }
    }
}

function patchArrayChildren(c1, c2, container, anchor) {
    const oldLength = c1.length
    const newLength = c2.length
    const commonLength = Math.min(oldLength, newLength)//取公共长度
    for (let i = 0; i < commonLength; i++) {
        patch(c1[i], c2[i], container, anchor)//完成公共长度对比
    }
    if (oldLength > newLength) {
        unmountChildren(c1.slice(commonLength))
    } else if (oldLength < newLength) {
        mountChildren(c2.slice(commonLength), container, anchor)
    }
}
