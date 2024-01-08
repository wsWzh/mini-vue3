import { reactice } from "./reactive/reactive";
import { ref } from "./reactive/ref";
import { computed } from "./reactive/computed";
import { effect } from "./reactive/effect";

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

const foo = (window.foo = ref(1))

effect(() => {
    console.log('ref foo', foo.value);
})


const com = (window.com = computed(() => {
    console.log('computed 计算');
    return foo.value * 2
}))

const com2 = (window.com2 = computed({
    get(){
        console.log('computed 计算');
        return foo.value * 2
    },
    set(value){
        foo.value = value
    }
}))

