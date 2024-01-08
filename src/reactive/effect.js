const effectStack = [] // 副作用函数栈(处理嵌套的effect)
let activeEffect //记录当前活动的副作用

/**
 *
 * @param {function} fn
 * @returns {function}
 */
export function effect(fn,options={}) {
    const effectFn = () => {
        try {
            activeEffect = effectFn
            effectStack.push(effectFn)//记录到栈
            return fn()
        } finally {
            effectStack.pop()//执行过的effect删除
            activeEffect = effectStack[effectStack.length - 1]
        }
    }

    if(!options.lazy){
        // 默认执行一次
        effectFn()
    }
    effectFn.scheduler = options.scheduler
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
    // 找到依赖响应式对应属性的副作用 依次执行
    deps.forEach(effectFn =>{
        if(effectFn.scheduler){
            effectFn.scheduler(effectFn)
        }else{
            effectFn()
        }
    })
}