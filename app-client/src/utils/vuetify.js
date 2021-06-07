import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';

//import Vuetify from 'vuetify/lib/framework'
//import '@mdi/font/css/materialdesignicons.css'
//import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify);

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  }
});