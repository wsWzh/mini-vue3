// 匹配有大写或者value,checked,selected,muted,disabled属性
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/
export function patchProps(oldProps, newProps, el) {
    if (oldProps === newProps) {
        return
    }
    oldProps = oldProps || {}
    newProps = newProps || {}
    for (const key in newProps) {
        if (key === 'key') {
            // 跳过当前循环 key不用比对
            continue
        }
        const next = newProps[key]
        const Prev = oldProps[key]
        if (next !== Prev) {
            patchDomProps(Prev, next, key, el)
        }
    }
    for (const key in oldProps) {
        if (key !== 'key' && newProps[key] == null) {
            patchDomProps(oldProps[key], null, key, el)
        }
    }
}

export function patchDomProps(prev, next, key, el) {
    switch (key) {
        case 'class':
            el.className = next || ''
            break
        case 'style':
            if (next == null) {
                el.removeAttribute('style')
            } else {
                for (const styleName in next) {
                    el.style[styleName] = next[styleName]
                }
                if (prev) {
                    for (const styleName in prev) {
                        if (next[styleName] == null) {
                            el.style[styleName] = ''
                        }
                    }
                }
            }
            break
        default:
            //处理事件 [^a-z] 不能a-z 匹配onClick
            if (/^on[^a-z]/.test(key)) {
                const eventName = key.slice(2).toLowerCase()
                if (prev) {
                    el.removeEventListener(eventName, prev)
                }
                if (next) {
                    el.addEventListener(eventName, next)
                }
            }
            // 处理html标签上标准属性
            if (domPropsRE.test(key)) {
                //{'checked:''} <input type='checked' checked/> 这种情况应该是true
                if (next === '' && typeof el[key] === 'boolean') {
                    next = true
                }
                // 标准属性可以直接设置值
                el[key] = next
            } else {
                // 会设置成字符串的false 还会被识别为true 所以要移除这个属性
                if (next == null || next === false) {
                    el.removeAttribute(key)
                } else {
                    // 处理自定义属性 例如<input type='checked' custom=123/>
                    el.setAttribute(key, next)
                }
            }
            break
    }
}