import MainLayout from '@/layouts/MainLayout.vue'
import ChannelPage from '@/pages/ChannelPage.vue'
import DirectPage from '@/pages/DirectPage.vue'
import HomePage from '@/pages/HomePage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import ErrorNotFound from '@/pages/ErrorNotFound.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', name: 'home', component: HomePage },
      { path: 'c/:name', component: ChannelPage },
      { path: 'dm/:nick/:threadId?', component: DirectPage },
      { path: 'settings', component: SettingsPage },
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
