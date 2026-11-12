import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import type { AuthenticatedSocket, MiddlewareContext } from '@rlanz/socket/types'
import { connections, isConnected, publishStatus, type SocketUser } from '#services/realtime'

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
    const userId = socket.getUserOrFail().id
    const wasConnected = isConnected(userId)

    connections.set(socket.id, socket)

    // prvé otvorené okno: ostatní ho uvidia s jeho stavom namiesto offline
    if (!wasConnected) {
      publishStatus(userId).catch(() => {})
    }
  }

  async onLeave(socket: AuthenticatedSocket<SocketUser>) {
    const userId = socket.getUserOrFail().id

    connections.delete(socket.id)

    // zavrel posledné okno: ostatní ho uvidia ako offline
    if (!isConnected(userId)) {
      publishStatus(userId).catch(() => {})
    }
  }
}
