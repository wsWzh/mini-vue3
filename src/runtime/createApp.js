import { typeOf } from '../utils'
import { h, render } from './index'

export function createApp(rootComponent) {

    const app = {
        mount(rootContainer) {
            if(typeOf(rootContainer,'string')){
                rootContainer=document.querySelector(rootContainer)
            }
            render(h(rootComponent), rootContainer)
        }
    }

    return app
}