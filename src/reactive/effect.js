let activeEffect //记录当前活动的副作用


export function effect(fn) {
    const effectFn = () => {
        try {
            activeEffect = effectFn
            return fn()
        } finally {
            // todo
        }
    }
    effectFn()
    return effectFn
}

// 存储副作用函数 建立副作用和响应式数据的关系 weakmap=>map=>set
// {
// [target1]:{
//     [key1]:set[effect1,effect2,...]
//     [key2]:set[effect1,effect2,...]
// },
// [target2]: {
//     [key1]:set[effect1,effect2,...]
//     [key2]:set[effect1,effect2,...]
// }
// }
const targetWeakMap = new WeakMap()

// 收集依赖
export function track(target, key) {
    if (!activeEffect) {

    }
    // WeakMap=>map
    let depsMap = targetWeakMap.get(target)
    if (!depsMap) {
        targetWeakMap.set(target, (depsMap = new Map()))
    }
    // map=>set
    let deps = depsMap.get(key)
    if (!deps) {
        deps.set(key, (deps = new Set()))
    }
    deps.add(activeEffect)
}

// 触发副作用函数
export function trigger(target, key) {
    const depsMap = targetWeakMap.get(target)
    if (!depsMap) {
        return
    }
    const deps = depsMap.get(key)
    if (!deps) {
        return
    }
    deps.forEach(effectFn => effectFn())
}