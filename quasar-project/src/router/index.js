import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes.js'
import { restoreSession, signedIn } from '../stores/auth.js'
export default defineRouter(() => {
  let createHistory = createWebHashHistory
  if (import.meta.env.QUASAR_SERVER) {
    createHistory = createMemoryHistory
  } else if (import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history') {
    createHistory = createWebHistory
  }

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  router.beforeEach(async to => {
    await restoreSession()
    if (to.meta.requiresAuth && !signedIn.value) {
      return { path: '/login', replace: true }
    }
    if (signedIn.value && (to.path === '/login' || to.path === '/register')) {
      return { path: '/home', replace: true }
    }
  })

  return router
})
