import { typeOf,isObject, hasChange } from "../utils";
import { track, trigger } from "./effect";

const proxyMap = new WeakMap();

export function reactice(target) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be an object`);
        return target;
    }

    // 特殊处理1 reactive(reactive(obj))
    if (isReactive(target)) {
        return target;
    }

    // 特殊处理2 const a=reactive(obj) const b=reactive(obj)
    if (proxyMap.has(target)) {
        return proxyMap.get(target);
    }

    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            // 读取__isReactive值时返回trur 没必要挂载到对象上
            if (key === '__isReactive') {
                return true;
            }
            const res = Reflect.get(target, key, receiver);
            //get 追踪依赖
            track(target, key)
            //特殊处理4 深层对象处理 vue2初始化递归整个对象
            return isObject(res) ? reactice(res) : res
        },
        set(target, key, value, receiver) {
            let oldLength = target.length
            const oldValue = target[key]
            const res = Reflect.set(target, key, value, receiver);//这里target的值已经更新
            // 特殊处理3 重复设值不触发更新
            if (hasChange(oldValue, value)) {
                trigger(target, key)
                // 特殊处理5 数组长度变化也要触发更新
                if (typeOf(target, 'array') && hasChange(oldLength, target.length)) {
                    trigger(target, 'length')
                }
            }
            return res
        }
    })

    proxyMap.set(target, proxy)
    return proxy
}

export function isReactive(target) {
    return !!(target && target.__isReactive) //双非返回boole
}