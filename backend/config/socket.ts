import { defineConfig } from '@rlanz/socket'

export default defineConfig({
  websocket: {
    path: '/socket',
    middleware: [
      () => import('@adonisjs/session/session_middleware'),
      () => import('@adonisjs/auth/initialize_auth_middleware'),
    ],
    async authenticate({ httpContext }) {
      await httpContext.auth.authenticateUsing(['web'])
      return {
        id: httpContext.auth.getUserOrFail().id,
        sessionId: httpContext.session.sessionId,
      }
    },
  },
})
