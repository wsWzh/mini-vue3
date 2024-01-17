import { ref, reactive, computed, effect } from './reactivity'
import { render, h, Text, Fragment, nextTick, createApp, renderList, resolveComponent, withModel } from './runtime'
import { parse, compile } from './compiler'
export const MiniVue = (window.MiniVue = {
    ref,
    reactive,
    computed,
    effect,
    render,
    h,
    Text,
    Fragment,
    nextTick,
    createApp,
    parse,
    compile,
    renderList,
    resolveComponent,
    withModel
})

//响应式
// const ob = (window.ob = reactice({ count: 0 ,ob:{a:1}}))

// effect(() => {
//     console.log('ob', ob.count);
// })

// effect(() => {
//     console.log('ob', ob.ob.a);
// })

// const arr=(window.arr = reactice([1, 2, 3]))

// effect(() => {
//     console.log('arr[4]', arr[4]);
// })

// effect(() => {
//     console.log('arr.length', arr.length);
// })

// const ob2=(window.ob2 = reactice({ count: 0 ,count2:1}))

// // 嵌套effect
// effect(() => {
//     effect(() => {
//         console.log('ob2 count2的打印信息', ob2.count2);
//     })
//     console.log('ob2 count的打印信息', ob2.count);
// })

// const foo = (window.foo = ref(1))

// effect(() => {
//     console.log('ref foo', foo.value);
// })


// const com = (window.com = computed(() => {
//     console.log('computed 计算');
//     return foo.value * 2
// }))

// const com2 = (window.com2 = computed({
//     get(){
//         console.log('computed 计算');
//         return foo.value * 2
//     },
//     set(value){
//         foo.value = value
//     }
// }))

//分支切换
// const state = (window.state = reactive({
//     ok: true,
//     text: 'hello world',
// }))

// 分支切换document.body.innerHTML的值在state.ok为true时才依赖state.text fasle时state.text值改变时不应该触发更新
// {
//     state:{
//         ok:effect,
//         text:effect
//     }
// }
// effect(() => {
//     console.log('渲染执行', document.body)
//     document.body.innerHTML = state.ok ? state.text : 'not'
// })

//render 虚拟dom
// const vnode = h('div', {
//     class: 'a b',
//     style: {
//         border: '1px solid',
//         fontSize: '20px'
//     },
//     onClick: () => console.log('click'),
//     id: 'foo',
//     checked: '',
//     custom: false
// },
//     [
//         h('ul', null, [
//             h('li', { style: { color: 'red' } }, 1),
//             h('li', null, 2),
//             h('li', { style: { color: 'bule' } }, 3),
//             h(Fragment, null, [h('li', null, '4'), h('li')]),
//             h('li', null, [h(Text, null, 'hello word')])
//         ])
//     ])
// render(vnode, document.body)

//diff算法 更新视图
// const n1 = h('ul', null, [
//     h('li', null, 'first'),
//     h(Fragment, null, []),
//     h('li', null, 'last')
// ]
// )


// const n2 = h('ul', null, [
//     h('li', null, 'first'),
//     h(Fragment, null, [
//         h('li', null, 'middle'),
//     ]),
//     h('li', null, 'last')
// ]

// )
// render(n1, document.body)


// setTimeout(() => {
//     render(n2, document.body)
// }, 2000)

//组件挂载更新相关
// const Comp={
//     props:['foo'],
//     render(ctx){
//         return h('div',{class:'a',id:ctx.bar},ctx.foo)
//     }
// }

// const Comp1 = {
//     setup(){
//         const count=ref(0)
//         const add=()=>{
//             count.value++
//             count.value++
//             count.value++
//             console.log(count.value,'会触发三次render');
//             // 应该等add函数执行完成才触发组件的update
//             // 利用js事件队列 将update推到事件队列 当主线程更新代码执行完毕才执行任务队列的update
//         }
//         return {
//             count,
//             add
//         }
//     },
//     render(ctx) {
//         return [
//             h('div',{id:'div'},ctx.count.value),//这里相当于模板为什么要加value 因为vue对setup返回的属性做了特殊处理
//             h('button', { id:'btn',onClick: ctx.add }, `add` + `${ctx.count.value}`)
//         ]
//     }
// }



// const vnodeProps={
//     foo:'foo',
//     bar:'bar'
// }

// // const vnode = h(Comp, vnodeProps)
// const vnode = h(Comp1)
// render(vnode, document.body)
// const div = document.getElementById('div')
// const btn = document.getElementById('btn')

// btn.click()
// console.log(div.innerHTML);//执行click更新了count还是打印0

// nextTick(()=>{
//     console.log(div.innerHTML)//这里也更新了
// })

// await nextTick()
// console.log(div.innerHTML)//这里也更新了

// setTimeout(()=>{
//     console.log(div.innerHTML)//这里就更新了 在vue源码是在netTick才能获取更新后的dom
// })


// createApp相关
// createApp({
//     setup() {
//         const count = ref(0)
//         const add = () => {
//             count.value++
//             count.value++
//             count.value++
//             console.log(count.value, '会触发三次render');
//             // 应该等add函数执行完成才触发组件的update
//             // 利用js事件队列 将update推到事件队列 当主线程更新代码执行完毕才执行任务队列的update
//         }
//         return {
//             count,
//             add
//         }
//     },
//     render(ctx) {
//         return [
//             h('div', { id: 'div' }, ctx.count.value),//这里相当于模板为什么要加value 因为vue对setup返回的属性做了特殊处理
//             h('button', { id: 'btn', onClick: ctx.add }, `add` + `${ctx.count.value}`)
//         ]
//     }
// }).mount(document.body)

// 模板编译

console.log(parse('<div id="foo" v-if="ok" >hello {{name}}</div>'));
