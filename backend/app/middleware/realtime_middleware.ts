import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'
import { channelRecipients, publish } from '#services/realtime'

export default class RealtimeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.request.method() !== 'POST') {
      return next()
    }

    const isMessage = ctx.request.url().endsWith('/messages')
    let id = Number(ctx.params.id)

    if (!id && ctx.request.url().includes('/channels')) {
      const name = ctx.request.input('name')

      if (typeof name === 'string') {
        const channel = await db.from('channels').where('name', name.trim().toLowerCase()).first()
        id = channel?.id
      }
    }

    let before: number[] = []

    if (id && !isMessage) {
      before = await channelRecipients(id)
    }

    await next()

    if (ctx.response.getStatus() >= 300) {
      return
    }

    try {
      if (isMessage) {
        await db.transaction(async (trx) => {
          // Zmena členstva počká, kým správu odošleme aktuálnym členom.
          const channel = await trx.from('channels').where('id', id).forShare().first()

          if (!channel) {
            return
          }

          const members = await trx
            .from('channel_memberships')
            .where('channel_id', id)
            .where('is_banned', false)
            .select('user_id')

          await publish(
            members.map((item) => Number(item.user_id)),
            'messageCreated',
            { channelId: id, message: ctx.response.getBody().data },
            trx
          )
        })
      } else {
        if (ctx.request.url().includes('/channels') && !id) {
          id = ctx.response.getBody()?.data?.id
        }

        let after: number[] = []

        if (id) {
          after = await channelRecipients(id)
        }

        await publish([...before, ...after, ctx.auth.getUserOrFail().id], 'channelsChanged', {})
      }
    } catch (error) {
      // Dáta už sú uložené; výpadok oznamovania nesmie zmeniť úspešný POST na chybu.
      ctx.logger.error({ err: error }, 'WebSocket notification failed')
    }
  }
}
