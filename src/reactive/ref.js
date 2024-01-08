import { track, trigger } from "./effect"
import { hasChange, isObject } from "../utils"

export function ref(value){
    if(isRef(value)){
        return value
    }
    return new RefImpl(value)
}

export function isRef(value){
    return !!(value && value.__isRef)
}

class RefImpl{
    constructor(value){
        this.__isRef = true
        this._value = convert(value)
    }
    get value(){
        track(this,'value')
        return this._value
    }
    set value(newValue){
        // 触发赋值不触发
        if (hasChange(newValue,this.value)){
            this._value = convert(newValue)
            trigger(this, 'value')//赋值后才触发
        }
    }
}

function convert(value) {
    return isObject(value) ? reactive(value) : value
}