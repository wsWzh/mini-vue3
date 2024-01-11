import { reactive } from "./reactivity/reactive";
import { ref } from "./reactivity/ref";
import { computed } from "./reactivity/computed";
import { effect } from "./reactivity/effect";
import { render, h, Text, Fragment } from './runtime'

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
const Comp={
    props:['foo'],
    render(ctx){
        return h('div',{class:'a',id:ctx.bar},ctx.foo)
    }
}

const Comp1 = {
    setup(){
        const count=ref(0)
        const add=()=>{
            count.value++
            console.log(c);
        }
        return {
            count,
            add
        }
    },
    render(ctx) {
        return [
            h('div',null,ctx.count.value),
            h('button',{onClick:ctx.add},'add')
        ]
    }
}

const vnodeProps={
    foo:'foo',
    bar:'bar'
}

// const vnode = h(Comp, vnodeProps)
const vnode = h(Comp1)
render(vnode,document.body)