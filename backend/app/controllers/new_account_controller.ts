import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

const duplicateAccountMessages: Record<string, string> = {
  users_nick_unique: 'Tento nick je už obsadený. Vyber si iný.',
  users_email_unique: 'Tento email už má účet. Prihlás sa alebo použi iný email.',
}

export default class NewAccountController {
  async store({ request, auth, response, serialize }: HttpContext) {
    const profile = await request.validateUsing(signupValidator)

    let user: User
    try {
      user = await User.create({
        ...profile,
        fullName: `${profile.firstName} ${profile.lastName}`,
      })
    } catch (error) {
      const { code, constraint } = error as { code?: string; constraint?: string }
      const message = code === '23505' && constraint && duplicateAccountMessages[constraint]
      if (!message) throw error
      return response.conflict({ message })
    }

    await auth.use('web').login(user)
    response.status(201)
    return serialize(UserTransformer.transform(user))
  }
}
