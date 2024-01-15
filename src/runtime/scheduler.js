const queue = []//存储队列
let isFlushing = false // 是否正在执行
const resolvedPromise = Promise.resolve()
let currentFlushPromise = null

export function nextTick(fn) {
    const p = currentFlushPromise || resolvedPromise//queue不一定有值
    return fn ? p.then(fn) : p//更新完成后执行 兼容await语法
}

export function queueJob(job) {
    // 去重避免重复添加
    if (!queue.length || !queue.includes(job)) {
        queue.push(job)
        queueFlush() //要放到微任务 不能立即执行 等同步代码执行完才更新
    }
}

// 清除 只需要执行一次
function queueFlush() {
    if (!isFlushing) {
        isFlushing = true
        // 要放到微任务 不能立即执行
        currentFlushPromise = resolvedPromise.then(flushJobs)
    }
}

function flushJobs(seen) {
    try {
        // 不能从尾循环 因为执行时queue可能还在添加 会漏掉
        for (let i = 0; i < queue.length; i++) {
            const job = queue[i]
            job()
        }
    } finally {
        isFlushing = false//还原执行状态
        queue.length = 0//清空队列
        currentFlushPromise = null
    }

}