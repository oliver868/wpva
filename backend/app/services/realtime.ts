import db from '@adonisjs/lucid/services/db'
import socket from '@rlanz/socket/services/main'
import type { AuthenticatedSocket } from '@rlanz/socket/types'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export type SocketUser = { id: number; sessionId: string }
export const connections = new Map<string, AuthenticatedSocket<SocketUser>>()

export function disconnectSession(sessionId: string) {
  for (const connection of connections.values()) {
    if (connection.getUserOrFail().sessionId === sessionId) {
      connection.disconnect()
    }
  }
}

export async function publish(
  userIds: number[],
  event: string,
  data: unknown,
  transaction?: TransactionClientContract
) {
  const recipients = new Set(userIds)
  const targets = [...connections.values()].filter((item) =>
    recipients.has(item.getUserOrFail().id)
  )

  if (!targets.length) {
    return
  }

  // Pri otvorenom sockete sa cookie znovu neposiela. Overíme aj platnosť session v DB.
  const sessions = await (transaction ?? db)
    .from('sessions')
    .whereIn(
      'id',
      targets.map((item) => item.getUserOrFail().sessionId)
    )
    .where('expires_at', '>', new Date())
    .select('id')

  const valid = new Set(sessions.map((item) => item.id))

  for (const connection of targets) {
    if (!valid.has(connection.getUserOrFail().sessionId)) {
      connection.disconnect()
    }
  }

  for (const id of recipients) {
    socket.to(`users/${id}`).emit(event, data)
  }
}

export async function channelRecipients(id: number) {
  const members = await db
    .from('channel_memberships')
    .where('channel_id', id)
    .where('is_banned', false)
    .select('user_id')
  const invited = await db.from('channel_invitations').where('channel_id', id).select('user_id')

  return [...members, ...invited].map((item) => Number(item.user_id))
}
