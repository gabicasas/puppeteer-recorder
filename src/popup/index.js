import Vue from 'vue'
import VueHighlightJS from 'vue-highlightjs'
import VueClipboard from 'vue-clipboard2'
import App from './components/App.vue'
import '../styles/style.scss'
import VueResource from 'vue-resource'

import BootstrapVue from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
/* import axios from 'axios'
import VueAxios from 'vue-axios'
    
Vue.use(VueAxios, axios) */

Vue.use(BootstrapVue)

Vue.use(VueResource)


Vue.config.productionTip = false
Vue.use(VueHighlightJS)
Vue.use(VueClipboard)

Vue.prototype.$chrome = chrome

const EventBus = new Vue();
export default EventBus;
/* eslint-disable no-new */
new Vue({
  el: '#root',
  render: h => h(App)
})
