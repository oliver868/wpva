import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ChannelPage from '@/pages/ChannelPage.vue'
import DirectPage from '@/pages/DirectPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import ErrorNotFound from '@/pages/ErrorNotFound.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/c/general' },
      { path: 'c/:name', component: ChannelPage },
      { path: 'dm/:nick', component: DirectPage },
      { path: 'settings', component: SettingsPage }
    ]
  },
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'login', component: LoginPage },
      { path: 'register', component: RegisterPage }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound
  }
]

export default routes
