import { effect, track, trigger } from "./effect"
import { typeOf } from "../utils"

export function computed(gettersOrOptions) {
    let getters, setter
    if (typeOf(gettersOrOptions, 'function')){
        getters = gettersOrOptions
        setter=()=>{
            console.warn('computed is readonly')
        }
    }else{
        getters = gettersOrOptions.get
        setter = gettersOrOptions.set
    }
    return new ComputedImpl(getters, setter)
}

class ComputedImpl {
    constructor(getters, setter) {
        this._setter = setter
        this._value = undefined//缓存值
        this._dirty = true//依赖是否更新
        //lazy:true 不立即执行
        this.effect = effect(getters, {
            lazy: true,
            scheduler: () => {
                if(!this._dirty){
                    this._dirty = true
                    trigger(this, 'value')
                }
            }
        })
    }
    get value() {
        if (this._dirty) {
            // 重新计算
            this._value = this.effect()
            this._dirty = false
            track(this,'value')
        }
        return this._value
    }
    set value(newValue) {
        this._setter(newValue)
    }
}