import MainLayout from '@/layouts/MainLayout.vue'
import ChannelPage from '@/pages/ChannelPage.vue'
import ChannelMembersPage from '@/pages/ChannelMembersPage.vue'
import DirectPage from '@/pages/DirectPage.vue'
import HomePage from '@/pages/HomePage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', name: 'home', component: HomePage },
      {
        path: 'c/:name',
        component: ChannelPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'c/:name/members',
        component: ChannelMembersPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'dm/:nick/:threadId?',
        component: DirectPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        component: SettingsPage,
        meta: { requiresAuth: true }
      },
      { path: 'login', component: LoginPage },
      { path: 'register', component: RegisterPage }
    ]
  }
]

export default routes
