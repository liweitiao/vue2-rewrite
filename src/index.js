import { initMixin } from './init'
import { renderMixin } from './render'
import { lifecycleMixin } from "./lifecycle"
import { stateMixin } from './state'
import { eventsMixin } from './events'
import { initGlobalApi } from './global-api/index'



function Vue(options) {
  // console.log('Vue---')
  this._init(options)
}

initMixin(Vue)
eventsMixin(Vue)
renderMixin(Vue)
lifecycleMixin(Vue)
stateMixin(Vue)

initGlobalApi(Vue)

export default Vue