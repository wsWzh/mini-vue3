const effectStack = [] // 副作用函数栈(处理嵌套的effect)
let activeEffect //记录当前活动的副作用

// 从依赖存储桶中删除依赖
function clear(effectFn) {
    effectFn.deps.forEach(effectSet => {
        effectSet.delete(effectFn)
    })
    effectFn.deps.clear()
}


/**
 *
 * @param {function} fn
 * @returns {function}
 */
export function effect(fn, options = {}) {
    const effectFn = () => {
        try {
            clear(effectFn) //重置依赖关系
            activeEffect = effectFn
            effectStack.push(effectFn)//记录到栈
            return fn()
        } finally {
            effectStack.pop()//执行过的effect删除
            activeEffect = effectStack[effectStack.length - 1]
        }
    }
    // 存储相关联的依赖存储桶
    effectFn.deps = new Set()
    effectFn.scheduler = options.scheduler
    if (!options.lazy) {
        // 默认执行一次
        effectFn()
    }
    return effectFn
}


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
// 存储副作用函数 建立副作用和响应式数据的关系 weakmap=>map=>set
const targetWeakMap = new WeakMap()

// 收集依赖
export function track(target, key) {
    if (!activeEffect) {
        return
    }
    let depsMap = targetWeakMap.get(target) //depsMap type=>map
    if (!depsMap) {
        targetWeakMap.set(target, (depsMap = new Map()))
    }

    let deps = depsMap.get(key) //deps type=>set
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    // add 处理切换分支
    // 在每次依赖执行前把该依赖从所有与之相关联的依赖存储桶删除，执行完后再重新收集依赖，确保没有不必要的依赖产生
    deps.add(activeEffect)
}

// 触发副作用函数
export function trigger(target, key) {
    console.log(targetWeakMap, 123);
    const depsMap = targetWeakMap.get(target)
    if (!depsMap) {
        return
    }
    const deps = depsMap.get(key)
    if (!deps) {
        return
    }

    const effectsToRun = new Set([...deps])
    // 找到依赖响应式对应属性的副作用 依次执行
    effectsToRun.forEach(effectFn => {
        if (effectFn.scheduler) {
            effectFn.scheduler(effectFn)
        } else {
            effectFn()
        }
    })
}