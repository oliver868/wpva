/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

const ChannelsController = () => import('#controllers/channels_controller')

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.get('csrf', [controllers.Sessions, 'csrf'])
        router.post('login', [controllers.Sessions, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.Sessions, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('/', [ChannelsController, 'index'])
        router.post('/', [ChannelsController, 'store'])
        router.post(':id/leave', [ChannelsController, 'leave'])
        router.post(':id/delete', [ChannelsController, 'destroy'])
        router.post(':id/visibility', [ChannelsController, 'updateVisibility'])
        router.post(':id/invitation', [ChannelsController, 'respondToInvitation'])
      })
      .where('id', router.matchers.number())
      .prefix('channels')
      .as('channels')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
