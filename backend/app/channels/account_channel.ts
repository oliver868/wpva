import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import type { AuthenticatedSocket, MiddlewareContext } from '@rlanz/socket/types'
import { connections, type SocketUser } from '#services/realtime'

async function authorize(ctx: MiddlewareContext<SocketUser>, next: () => Promise<void>) {
  if (String(ctx.socket.getUserOrFail().id) !== ctx.params.id) {
    throw new SocketResponseError('Tento odber nie je tvoj.')
  }

  await next()
}

export default class AccountChannel extends BaseChannel<SocketUser> {
  static pattern = 'users/:id'
  static middlewares = [authorize]

  async onJoin(socket: AuthenticatedSocket<SocketUser>) {
    connections.set(socket.id, socket)
  }

  async onLeave(socket: AuthenticatedSocket<SocketUser>) {
    connections.delete(socket.id)
  }
}
