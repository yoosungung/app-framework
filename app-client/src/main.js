import Vue from "vue";
import App from "./App.vue";
import "./utils/registerServiceWorker";
import router from "./utils/router";
import store from "./utils/store";
import vuetify from './utils/vuetify';
import './utils/axios';
import UiConfig from './utils/UIConfig';

Vue.config.productionTip = true;

Vue.use(UiConfig)

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
