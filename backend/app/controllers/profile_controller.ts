import UserTransformer from '#transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { publishStatus } from '#services/realtime'

const newStatus = vine.create({ status: vine.enum(['online', 'dnd', 'offline']) })

export default class ProfileController {
  async show({ auth, response, serialize }: HttpContext) {
    response.header('Cache-Control', 'no-store')
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }

  async updateStatus({ auth, request, response, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const { status } = await request.validateUsing(newStatus)

    user.status = status
    await user.save()

    try {
      await publishStatus(user.id)
    } catch (error) {
      // stav je uložený, výpadok oznamovania nesmie zmeniť odpoveď na chybu
      logger.error({ err: error }, 'Status notification failed')
    }

    return response.noContent()
  }
}
