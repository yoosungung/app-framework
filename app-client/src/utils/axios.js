"use strict";

import Vue from 'vue';
import axios from "axios";

//import apiconf from '../../server/svr.config.json'
// http://${apiconf.app.ip}:${apiconf.app.port},

// Full config:  https://github.com/axios/axios#request-config
let config = {
  baseURL: window.location.origin,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60 * 1000, // Timeout
  withCredentials: false // Check cross-site Access-Control
};

const _axios = axios.create(config);

_axios.useInterceptors = (app) => {
  _axios.interceptors.request.use(
    function (config) {
      config.headers.common['x-access-token'] = app.$store.state.token
      return config;
    },
    function (error) {
      console.log(error)
      app.serverError(error)
      return Promise.reject(error);
    }
  );

  _axios.interceptors.response.use(
    function (response) {
      app.$store.commit('setToken', response.headers['x-access-token'])
      return response;
    },
    function (error) {
      if (error.response && error.response.status == 401) {
        app.$store.commit('setToken', '')
        app.$router.push({ name: 'Signin', path: '/Signin' })
      } else {
        console.log(error)
        app.serverError(error)
      }
      return Promise.reject(error);
    }
  );
}

Plugin.install = function (Vue) {
  Vue.axios = _axios;
  window.axios = _axios;

  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios;
      }
    },
    $axios: {
      get() {
        return _axios;
      }
    },
  });
};

Vue.use(Plugin)

export default Plugin;
