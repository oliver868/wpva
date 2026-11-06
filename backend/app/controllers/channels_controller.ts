import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

const name = () =>
  vine
    .string()
    .trim()
    .toLowerCase()
    .maxLength(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const createChannel = vine.create({ name: name(), private: vine.boolean() })
const setVisibility = vine.create({ private: vine.boolean() })
const invitationDecision = vine.create({ accept: vine.boolean() })

function inactivityCutoff() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
}

export default class ChannelsController {
  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const cutoff = inactivityCutoff()
    await db.from('channels').where('last_activity_at', '<', cutoff).delete()

    const channels = await db
      .from('channels as channel')
      .join('users as owner', 'owner.id', 'channel.owner_id')
      .leftJoin('channel_memberships as membership', (join) =>
        join.on('membership.channel_id', 'channel.id').andOnVal('membership.user_id', user.id)
      )
      .leftJoin('channel_invitations as invitation', (join) =>
        join.on('invitation.channel_id', 'channel.id').andOnVal('invitation.user_id', user.id)
      )
      .leftJoin('users as inviter', 'inviter.id', 'invitation.invited_by')
      .where((query) =>
        query.whereNull('membership.is_banned').orWhere('membership.is_banned', false)
      )
      .where((query) =>
        query.whereNotNull('membership.user_id').orWhereNotNull('invitation.user_id')
      )
      .select(
        'channel.id',
        'channel.name',
        'channel.server_name',
        'channel.is_private as private',
        'owner.nick as admin',
        'owner.id as owner_id',
        'membership.user_id as member_id',
        'inviter.nick as invited_by',
        'inviter.id as inviter_id'
      )
      .orderByRaw('invitation.user_id IS NULL')
      .orderBy('channel.name')

    const memberIds = channels.filter((channel) => channel.member_id).map((channel) => channel.id)
    const members = await db
      .from('channel_memberships as membership')
      .join('users', 'users.id', 'membership.user_id')
      .whereIn('membership.channel_id', memberIds)
      .where('membership.is_banned', false)
      .select('membership.channel_id', 'users.id', 'users.nick')
      .orderBy('users.nick')
    const byChannel = new Map<number, string[]>()
    for (const member of members) {
      const nicks = byChannel.get(member.channel_id) ?? []
      nicks.push(member.nick ?? `account:${member.id}`)
      byChannel.set(member.channel_id, nicks)
    }

    response.header('Cache-Control', 'no-store')
    return {
      data: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        serverName: channel.server_name,
        private: channel.private,
        admin: channel.admin ?? `account:${channel.owner_id}`,
        members: channel.member_id ? (byChannel.get(channel.id) ?? []) : [],
        invitedBy: channel.inviter_id
          ? (channel.invited_by ?? `account:${channel.inviter_id}`)
          : null,
      })),
    }
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createChannel)
    const channel = await db.transaction(async (trx) => {
      await trx
        .from('channels')
        .where('name', payload.name)
        .where('last_activity_at', '<', inactivityCutoff())
        .delete()

      const [created] = await trx
        .insertQuery()
        .table('channels')
        .insert({ name: payload.name, owner_id: user.id, is_private: payload.private })
        .onConflict('name')
        .ignore()
        .returning(['id', 'name'])
      if (!created) return null

      await trx.insertQuery().table('channel_memberships').insert({
        channel_id: created.id,
        user_id: user.id,
      })
      return created
    })

    if (!channel) return response.conflict({ message: 'Kanál s týmto názvom už existuje.' })
    return response.created({ data: channel })
  }

  async leave({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const left = await db.transaction(async (trx) => {
      const channel = await trx
        .from('channels')
        .where('id', params.id)
        .where('last_activity_at', '>=', inactivityCutoff())
        .forUpdate()
        .first()
      if (!channel) return false

      if (channel.owner_id === user.id) {
        await trx.from('channels').where('id', channel.id).delete()
        return true
      }

      const key = { channel_id: channel.id, user_id: user.id }
      const removed = await trx
        .from('channel_memberships')
        .where({ ...key, is_banned: false })
        .delete()
        .returning('user_id')
      if (!removed.length) return false
      await trx.from('channel_invitations').where(key).delete()
      return true
    })
    if (!left) return response.notFound({ message: 'Kanál už nie je v tvojom zozname.' })
    return response.noContent()
  }

  async destroy({ auth, params, response }: HttpContext) {
    const removed = await db
      .from('channels')
      .where({ id: params.id, owner_id: auth.getUserOrFail().id })
      .where('last_activity_at', '>=', inactivityCutoff())
      .delete()
      .returning('id')
    if (!removed.length)
      return response.notFound({ message: 'Kanál môže zrušiť iba jeho správca.' })
    return response.noContent()
  }

  async updateVisibility({ auth, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(setVisibility)
    const updated = await db
      .from('channels')
      .where({ id: params.id, owner_id: auth.getUserOrFail().id })
      .where('last_activity_at', '>=', inactivityCutoff())
      .update({ is_private: payload.private })
      .returning('id')
    if (!updated.length)
      return response.notFound({ message: 'Viditeľnosť môže zmeniť iba správca kanála.' })
    return response.noContent()
  }

  async respondToInvitation({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { accept } = await request.validateUsing(invitationDecision)
    const resolved = await db.transaction(async (trx) => {
      const channel = await trx
        .from('channels')
        .where('id', params.id)
        .where('last_activity_at', '>=', inactivityCutoff())
        .forUpdate()
        .first()
      if (!channel) return false

      const key = { channel_id: channel.id, user_id: user.id }
      const membership = await trx.from('channel_memberships').where(key).first()
      if (membership?.is_banned) return false
      const removed = await trx.from('channel_invitations').where(key).delete().returning('user_id')
      if (!removed.length) return false

      if (accept && !membership) await trx.insertQuery().table('channel_memberships').insert(key)
      return true
    })
    if (!resolved) return response.notFound({ message: 'Pozvánka už nie je dostupná.' })
    return response.noContent()
  }
}
