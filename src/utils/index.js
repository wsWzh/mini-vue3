/**
 * 判断数据类型
 * @param {*} target
 * @param {*} typeName
 * @returns
 */
export function typeOf(target, typeName = undefined) {
    const text = Object.prototype.toString.apply(target)
    const type = /\[object (\w+)]/.exec(text)[1].toLocaleLowerCase()
    return typeName ? typeName === type : type
}

export function isObject(target) {
    return typeof target === 'object' && target !== null
}

/**
 * 判断两个值是否相等
 * @param {*} oldValue
 * @param {*} value
 * @returns {Boolean}
 */
export function hasChange(oldValue, value) {
    //NaN特殊处理
    return oldValue !== value && (!Number.isNaN(oldValue) && !Number.isNaN(value))
}
