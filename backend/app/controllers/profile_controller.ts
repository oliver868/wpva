import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth, response, serialize }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }
}
