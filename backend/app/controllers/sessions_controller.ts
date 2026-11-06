import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class SessionsController {
  csrf({ request, response }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    return { token: request.csrfToken }
  }

  async store({ request, auth, serialize }: HttpContext) {
    const { identifier, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(identifier, password)
    await auth.use('web').login(user)

    return serialize(UserTransformer.transform(user))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.noContent()
  }
}
