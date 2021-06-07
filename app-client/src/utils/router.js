import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/Signin',
    name: 'Signin',
    component: () => import('../views/Signin.vue')
  },
  {
    path: '/:objectname/List',
    name: 'List',
    component: () => import('../views/List.vue'),
    props: true
  },
  {
    path: '/:objectname/Detail/:objectid',
    name: 'Detail',
    component: () => import('../views/Detail.vue'),
    props: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router