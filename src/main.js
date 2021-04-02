import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './less/base.less'
import ViewUI from 'view-design'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import{sha1} from './shs1';
Vue.use(ViewUI)
Vue.use(ElementUI)
Vue.config.productionTip = false
//绑定渲染模块
const { ipcRenderer, remote } = window.require('electron')
Vue.prototype.$remote = remote
//主-渲染
Vue.prototype.$ipcRenderer = ipcRenderer

Vue.prototype.$sha1 = sha1

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
