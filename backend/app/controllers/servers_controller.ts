import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

const createServer = vine.create({
  name: vine.string().trim().minLength(1).maxLength(60),
})

export default class ServersController {
  async store({ auth, request, response }: HttpContext) {
    const { name } = await request.validateUsing(createServer)
    try {
      const [server] = await db
        .insertQuery()
        .table('servers')
        .insert({ name, owner_id: auth.getUserOrFail().id })
        .returning(['id', 'name'])
      return response.created({ data: server })
    } catch (error) {
      const { code, constraint } = error as { code?: string; constraint?: string }
      if (code !== '23505' || constraint !== 'servers_name_unique') throw error
      return response.conflict({ message: 'Server s týmto názvom už existuje.' })
    }
  }
}
