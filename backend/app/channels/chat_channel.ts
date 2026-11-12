import db from '@adonisjs/lucid/services/db'
import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import { onMessage } from '@rlanz/socket/decorators'
import type { AuthenticatedSocket, MiddlewareContext } from '@rlanz/socket/types'
import type { SocketUser } from '#services/realtime'

type ServerEvents = {
  typing: { nick: string; text: string }
}

async function isMember(channelId: string, userId: number) {
  if (!/^\d+$/.test(channelId)) {
    return false
  }

  const membership = await db
    .from('channel_memberships')
    .where({ channel_id: Number(channelId), user_id: userId, is_banned: false })
    .first()

  return Boolean(membership)
}

// odoberať kanál môže iba jeho člen
async function authorize(ctx: MiddlewareContext<SocketUser>, next: () => Promise<void>) {
  if (!(await isMember(ctx.params.id, ctx.socket.getUserOrFail().id))) {
    throw new SocketResponseError('Nie si členom tohto kanála.')
  }

  await next()
}

// rozpísaná správa pre stavovú lištu „píše…“, posiela sa pri každej zmene textu
export default class ChatChannel extends BaseChannel<SocketUser, ServerEvents> {
  static pattern = 'channels/:id'
  static middlewares = [authorize]

  @onMessage('typing')
  async typing(socket: AuthenticatedSocket<SocketUser>, payload: { text: string }) {
    const user = socket.getUserOrFail()

    // člena mohli medzitým z kanála vyhodiť
    if (!(await isMember(this.params.id, user.id))) {
      return
    }

    const text = String(payload?.text ?? '').slice(0, 2000)

    this.broadcastExcept(socket.id, 'typing', { nick: user.nick, text })
  }
}
