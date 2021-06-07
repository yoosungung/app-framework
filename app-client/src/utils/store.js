
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      id: '',
      grp: '',
      name: '',
      isadmin: ''
    },
    token: ''
  },
  getter: {
  },
  mutations: {
    setUser(state, data) {
      state.user.id = data.id
      state.user.grp = data.grp
      state.user.name = data.name
      state.user.isadmin = data.isadmin
    },
    setToken(state, data) {
      state.token = data
    }
  },
  actions: {
  },
  modules: {
  }
})