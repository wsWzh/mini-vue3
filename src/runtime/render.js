import { ShapeFlags } from "./vnode"
import { patchProps } from './patchProps'
import { mountComponent } from './component'

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
    if (n1) {
      //update component
    } else {
        mountComponent(n2, container, anchor,patch)
    }
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
    //类型不同
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
            // 偷懒只要第一个元素有key就当做都有key
            if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
                patchKeyedChildren(c1, c2, container, anchor)
            } else {
                patchUnkeyedChildren(c1, c2, container, anchor)
            }
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


// 没有key属性的对比
function patchUnkeyedChildren(c1, c2, container, anchor) {
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

// 传统diff算法 用key属性来判断节点是否要复用
function patchKeyedChildren2(c1, c2, container, anchor) {
    const map = new Map()
    c1.forEach((prev, j) => map.set(prev.key, { prev, j }))
    let maxNewIndexSoFar = 0;
    for (let i = 0; i < c2.length; i++) {
        const next = c2[i]
        const curAnchor = i === 0 ? c1[0].el : c2[i - 1].el.nextSibling
        // 找到key相同的元素进行更新
        if (map.has(next.key)) {
            const { prev, j } = map.get(next.key)
            patch(prev, next, container, anchor)
            // 小于需要移动
            if (j < maxNewIndexSoFar) {
                container.insertBefore(next.el, curAnchor)
            } else {
                maxNewIndexSoFar = j
            }
            // 更新了就删掉 剩下的就是需要unmount
            map.delete(next.key)
        } else {
            // c1没找到说明是c2新增的节点要插入
            patch(null, next, container, curAnchor)
        }
    }
    // 删除c1多出来的节点
    map.forEach(({ prev }) => unmount(prev))
}

function patchKeyedChildren(c1, c2, container, anchor) {
    let i = 0 //头
    let e1 = c1.length - 1//旧节点的尾
    let e2 = c2.length - 1//新节点的尾

    // 1.从左至右依次比对 更新key相等的元素
    while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
        patch(c1[i], c2[i], container, anchor)
        i++
    }

    //2.从右至左依次比对
    while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
        patch(c1[e1], c2[e2], container, anchor)
        e1--
        e2--
    }

    //3.经过步骤1,2后
    // i>e1说明旧节点比对完毕 剩下的是e2新增的节点
    if (i > e1) {
        // 挂载起点为i终点为e2区间的节点
        for (let j = i; j <= e2; j++) {
            const nextPos = e2 + 1 //步骤1,2后比对的最后节点下标 有可能是最后一个
            const curAnchor = c2[nextPos] && c2[nextPos].el || anchor
            patch(null, c2[j], container, curAnchor)
        }
    } else if (i > e2) {
        // i > e1说明旧节点比对完毕 剩下的是e2删除的节点
        // 卸载起点为i终点为e1区间的节点
        for (let j = i; j <= e1; j++) {
            unmount(c1[j])
        }
    } else {
        // i不大于e1并且i不大于e2说明区间内的节点key不同
        //4.对区间内元素采用传统的diff算法 但是不做真正的添加和移动只做标记和删除
        const map = new Map()
        // 将比对头尾后的区间设置到map
        for (let j = i; j <= e1; j++) {
            const prev = c1[j]
            map.set(prev.key, { prev, j })
        }
        // c1.forEach((prev, j) => map.set(prev.key, { prev, j }))//j是c1的下标
        let maxNewIndexSoFar = 0;
        let move = false//表示需不需要移动
        const source = new Array(e2 - i + 1).fill(-1)//记录c2在c1的下标 找不到就是-1
        const toMounted = []//记录需要挂载的节点 只用move判断有些情况无法处理
        for (let k = 0; k < source.length; k++) { //这里遍历source而不是c2是因为c2可能已经比对头尾了
            const next = c2[k + i]//所以这里要加i
            const curAnchor = k === 0 ? c1[0].el : c2[k - 1].el.nextSibling
            // 找到key相同的元素进行更新
            if (map.has(next.key)) {
                const { prev, j } = map.get(next.key)
                patch(prev, next, container, anchor)
                // 小于需要移动
                if (j < maxNewIndexSoFar) {
                    move = true
                    // 不做移动
                    // container.insertBefore(next.el, curAnchor)
                } else {
                    maxNewIndexSoFar = j
                }
                source[k] = j//记录c2在c1的下标
                // 更新了就删掉 剩下的就是需要unmount
                map.delete(next.key)
            } else {
                // c1没找到说明是c2新增的节点要插入
                // 不做添加
                // patch(null, next, container, curAnchor)
                toMounted.push(k + i)
            }
        }
        // 删除c1多出来的节点
        map.forEach(({ prev }) => unmount(prev))
        // 5.需要移动 采用最新的最长上升子序列算法
        if (move) {
            const seq = getSequence(source) //seq记录最长上升子序列的下标
            let j = seq.length - 1
            for (let k = source.length - 1; k >= 0; k--) {
                if (seq[j] === k) {
                    //k在seq记录的下标里面 说明是最长上升子序列 不用移动
                    j--//左移一位继续对比
                } else {
                    const pos = k + i
                    const nextPos = pos + 1
                    const curAnchor = c2[nextPos] && c2[nextPos].el || anchor
                    if (source[k] === -1) {
                        //-1代表在c1找不到 说明是新节点 要挂载
                        patch(null, c2[pos], container, curAnchor)
                    } else {
                        // 否则移动
                        container.insertBefore(c2[pos].el, curAnchor)
                    }
                }
            }
        } else if (toMounted.length) {
            //6.不需要移动但是还有未添加的元素
            for (let k = toMounted.length - 1; k >= 0; k--) {
                const pos = toMounted[k]
                const nextPos = pos + 1
                const curAnchor = c2[nextPos] && c2[nextPos].el || anchor
                patch(null, c2[pos], container, curAnchor)
            }
        }
    }
}


// [10,9,2,5,3,7,101,18]=> arr[2,3,7,18] position[0, 0, 0, 1, 1, 2, 3, 3] =>arr[2, 4, 5, 7]
const getSequence = function (nums) {
    const arr = [nums[0]]
    const position = [0] //记录元素插入下标
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] === -1) {
            // 跳过这次循环
            continue
        }
        // 大于最后一个则加到后面
        if (nums[i] > arr[arr.length - 1]) {
            arr.push(nums[i])
            position.push(arr.length - 1)
        } else {
            //小于最后一个则从前面找到第一个比他大的替换他
            let l = 0, r = arr.length - 1;
            while (l <= r) {
                let mid = ~~((l + r) / 2);//向下取整
                if (nums[i] > arr[mid]) {
                    l = mid + 1;
                } else if (nums[i] < arr[mid]) {
                    r = mid - 1;
                } else {
                    l = mid;
                    break;
                }
            }
            arr[l] = nums[i];
            position.push(l);
        }
    }
    let cur = arr.length - 1
    for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
        if (position[i] === cur) {
            arr[cur] = i //把最长上升子序列数组替换成在原数组对应下标
            cur--
        }
    }
    return arr
}