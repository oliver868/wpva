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
const joinChannel = vine.create({ name: name(), private: vine.boolean().optional() })
const setVisibility = vine.create({ private: vine.boolean() })
const invitationDecision = vine.create({ accept: vine.boolean() })
const targetUser = vine.create({
  nick: vine
    .string()
    .trim()
    .toLowerCase()
    .regex(/^@?[a-z0-9_-]+$/)
    .maxLength(33),
})

const newMessage = vine.create({ text: vine.string().trim().minLength(1).maxLength(2000) })

// koľko starších správ sa načíta naraz (infinite scroll)
const messagePageSize = 20

function inactivityCutoff() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
}

function positiveId(value: unknown) {
  const id = Number(value)
  return Number.isInteger(id) && id >= 0 ? id : null
}

// výsledok akcie v transakcii: HTTP status + správa pre používateľa
type Outcome = { status: number; message?: string }

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

  // /join nazov [private]: ak kanál neexistuje, vytvorí ho, inak ťa pridá do verejného kanála
  async join({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(joinChannel)
    const outcome = await db.transaction(async (trx): Promise<Outcome> => {
      await trx
        .from('channels')
        .where('name', payload.name)
        .where('last_activity_at', '<', inactivityCutoff())
        .delete()

      const channel = await trx.from('channels').where('name', payload.name).forUpdate().first()
      if (!channel) {
        const [created] = await trx
          .insertQuery()
          .table('channels')
          .insert({ name: payload.name, owner_id: user.id, is_private: payload.private ?? false })
          .onConflict('name')
          .ignore()
          .returning('id')
        if (!created) return { status: 409, message: 'Kanál práve niekto vytvoril. Skús to znova.' }
        await trx
          .insertQuery()
          .table('channel_memberships')
          .insert({ channel_id: created.id, user_id: user.id })
        return { status: 201 }
      }

      const key = { channel_id: channel.id, user_id: user.id }
      const membership = await trx.from('channel_memberships').where(key).first()
      if (membership?.is_banned) return { status: 403, message: 'V tomto kanáli máš ban.' }
      if (membership) return { status: 200 }

      // do súkromného kanála sa dá pridať iba cez pozvánku od správcu
      const invitation = await trx.from('channel_invitations').where(key).first()
      if (channel.is_private && !invitation) {
        return { status: 403, message: 'Súkromný kanál – potrebuješ pozvánku od správcu.' }
      }
      await trx.insertQuery().table('channel_memberships').insert(key)
      await trx.from('channel_invitations').where(key).delete()
      return { status: 200 }
    })

    if (outcome.status >= 400) return response.status(outcome.status).send({ message: outcome.message })
    return response.status(outcome.status).send({ data: { name: payload.name } })
  }

  // /invite nick: do súkromného kanála pozýva iba správca, do verejného hociktorý člen;
  // správca pozvánkou zároveň obnoví prístup zabanovanému používateľovi
  async invite({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const nick = (await request.validateUsing(targetUser)).nick.replace(/^@/, '')
    const outcome = await db.transaction(async (trx): Promise<Outcome> => {
      const channel = await trx
        .from('channels')
        .where('id', params.id)
        .where('last_activity_at', '>=', inactivityCutoff())
        .forUpdate()
        .first()
      if (!channel) return { status: 404, message: 'Kanál už neexistuje.' }

      const isMember = await trx
        .from('channel_memberships')
        .where({ channel_id: channel.id, user_id: user.id, is_banned: false })
        .first()
      if (!isMember) return { status: 403, message: 'Pozývať môže iba člen tohto kanála.' }
      const isOwner = channel.owner_id === user.id
      if (channel.is_private && !isOwner) {
        return { status: 403, message: 'Do súkromného kanála pozýva iba správca.' }
      }

      const target = await trx.from('users').where('nick', nick).first()
      if (!target) return { status: 404, message: `Používateľ @${nick} neexistuje.` }

      const key = { channel_id: channel.id, user_id: target.id }
      const membership = await trx.from('channel_memberships').where(key).first()
      if (membership && !membership.is_banned) {
        return { status: 409, message: `@${nick} už je členom tohto kanála.` }
      }
      if (membership?.is_banned) {
        if (!isOwner) {
          return { status: 403, message: 'Prístup zablokovanému používateľovi obnoví iba správca.' }
        }
        await trx.from('channel_memberships').where(key).delete()
      }

      const invited = await trx
        .insertQuery()
        .table('channel_invitations')
        .insert({ ...key, invited_by: user.id })
        .onConflict(['channel_id', 'user_id'])
        .ignore()
        .returning('user_id')
      if (!invited.length) return { status: 409, message: `@${nick} už má pozvánku do tohto kanála.` }
      return { status: 204 }
    })

    if (outcome.status >= 400) return response.status(outcome.status).send({ message: outcome.message })
    return response.noContent()
  }

  // /revoke nick: správca súkromného kanála odoberie člena (alebo zruší jeho pozvánku)
  async revoke({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const nick = (await request.validateUsing(targetUser)).nick.replace(/^@/, '')
    const outcome = await db.transaction(async (trx): Promise<Outcome> => {
      const channel = await trx
        .from('channels')
        .where('id', params.id)
        .where('last_activity_at', '>=', inactivityCutoff())
        .forUpdate()
        .first()
      if (!channel) return { status: 404, message: 'Kanál už neexistuje.' }
      if (channel.owner_id !== user.id) return { status: 403, message: 'Odoberať môže iba správca.' }
      if (!channel.is_private) {
        return { status: 400, message: 'Vo verejnom kanáli použi /kick nick.' }
      }

      const target = await trx.from('users').where('nick', nick).first()
      if (!target) return { status: 404, message: `Používateľ @${nick} neexistuje.` }
      if (target.id === channel.owner_id) {
        return { status: 400, message: 'Správcu nemožno odobrať. Na zrušenie kanála použi /quit.' }
      }

      const key = { channel_id: channel.id, user_id: target.id }
      const removed = await trx
        .from('channel_memberships')
        .where({ ...key, is_banned: false })
        .delete()
        .returning('user_id')
      const withdrawn = await trx.from('channel_invitations').where(key).delete().returning('user_id')
      if (!removed.length && !withdrawn.length) {
        return { status: 404, message: `@${nick} nie je členom tohto kanála.` }
      }
      return { status: 204 }
    })

    if (outcome.status >= 400) return response.status(outcome.status).send({ message: outcome.message })
    return response.noContent()
  }

  // /kick nick vo verejnom kanáli: správca vyhodí hneď, ostatní členovia hlasujú,
  // pri 3 hlasoch má používateľ trvalý ban (is_banned v channel_memberships)
  async kick({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const nick = (await request.validateUsing(targetUser)).nick.replace(/^@/, '')
    const outcome = await db.transaction(async (trx): Promise<Outcome> => {
      const channel = await trx
        .from('channels')
        .where('id', params.id)
        .where('last_activity_at', '>=', inactivityCutoff())
        .forUpdate()
        .first()
      if (!channel) return { status: 404, message: 'Kanál už neexistuje.' }
      if (channel.is_private) return { status: 400, message: 'V súkromnom kanáli použi /revoke nick.' }

      const isMember = await trx
        .from('channel_memberships')
        .where({ channel_id: channel.id, user_id: user.id, is_banned: false })
        .first()
      if (!isMember) return { status: 403, message: 'Vyhadzovať môže iba člen tohto kanála.' }

      const target = await trx.from('users').where('nick', nick).first()
      if (!target) return { status: 404, message: `Používateľ @${nick} neexistuje.` }
      if (target.id === user.id) {
        return { status: 400, message: 'Seba nemôžeš vyhodiť. Na odchod z kanála použi /cancel.' }
      }
      if (target.id === channel.owner_id) {
        return { status: 403, message: 'Správcu kanála nemožno vyhodiť.' }
      }

      const key = { channel_id: channel.id, user_id: target.id }
      const membership = await trx.from('channel_memberships').where(key).first()
      if (!membership || membership.is_banned) {
        return { status: 404, message: `@${nick} nie je členom tohto kanála.` }
      }

      let votes = 0
      if (channel.owner_id !== user.id) {
        const voted = await trx
          .insertQuery()
          .table('channel_kick_votes')
          .insert({ channel_id: channel.id, target_id: target.id, voter_id: user.id })
          .onConflict(['channel_id', 'target_id', 'voter_id'])
          .ignore()
          .returning('voter_id')
        if (!voted.length) return { status: 409, message: `Za vyhodenie @${nick} si už hlasoval.` }

        // počítajú sa iba hlasy ľudí, ktorí sú stále členmi kanála
        const [{ count }] = await trx
          .from('channel_kick_votes as vote')
          .join('channel_memberships as membership', (join) =>
            join
              .on('membership.channel_id', 'vote.channel_id')
              .andOn('membership.user_id', 'vote.voter_id')
          )
          .where({ 'vote.channel_id': channel.id, 'vote.target_id': target.id })
          .where('membership.is_banned', false)
          .count('* as count')
        votes = Number(count)
        if (votes < 3) return { status: 200, message: `Hlas za vyhodenie @${nick}: ${votes}/3.` }
      }

      await trx.from('channel_memberships').where(key).update({ is_banned: true })
      await trx.from('channel_invitations').where(key).delete()
      await trx.from('channel_kick_votes').where({ channel_id: channel.id, target_id: target.id }).delete()
      return { status: 200, message: `@${nick} má trvalý ban v #${channel.name}.` }
    })

    return response.status(outcome.status).send({ message: outcome.message })
  }

  // GET :id/messages            → posledných 20 správ
  // GET :id/messages?before=ID  → 20 starších správ (infinite scroll)
  // GET :id/messages?after=ID   → nové správy od ID (pravidelné obnovovanie)
  async messages({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const membership = await db
      .from('channel_memberships as membership')
      .join('channels as channel', 'channel.id', 'membership.channel_id')
      .where({ 'membership.channel_id': params.id, 'membership.user_id': user.id })
      .where('membership.is_banned', false)
      .where('channel.last_activity_at', '>=', inactivityCutoff())
      .first()
    if (!membership) return response.notFound({ message: 'Kanál nie je dostupný.' })

    const query = db
      .from('messages as message')
      .join('users as author', 'author.id', 'message.user_id')
      .where('message.channel_id', params.id)
      .select('message.id', 'message.text', 'message.created_at', 'author.nick', 'author.id as author_id')

    const after = positiveId(request.input('after'))
    const before = positiveId(request.input('before'))
    let rows
    let hasMore = false
    if (after !== null) {
      rows = await query.where('message.id', '>', after).orderBy('message.id', 'asc').limit(100)
    } else {
      if (before !== null) query.where('message.id', '<', before)
      rows = await query.orderBy('message.id', 'desc').limit(messagePageSize + 1)
      hasMore = rows.length > messagePageSize
      rows = rows.slice(0, messagePageSize).reverse()
    }

    response.header('Cache-Control', 'no-store')
    return {
      data: rows.map((row) => ({
        id: row.id,
        from: row.nick ?? `account:${row.author_id}`,
        text: row.text,
        createdAt: row.created_at,
      })),
      hasMore,
    }
  }

  // odoslanie správy; posunie last_activity_at (kanál bez správ 30 dní zaniká)
  async sendMessage({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { text } = await request.validateUsing(newMessage)
    const message = await db.transaction(async (trx) => {
      const channel = await trx
        .from('channels')
        .where('id', params.id)
        .where('last_activity_at', '>=', inactivityCutoff())
        .forUpdate()
        .first()
      if (!channel) return null
      const isMember = await trx
        .from('channel_memberships')
        .where({ channel_id: channel.id, user_id: user.id, is_banned: false })
        .first()
      if (!isMember) return null

      const [created] = await trx
        .insertQuery()
        .table('messages')
        .insert({ channel_id: channel.id, user_id: user.id, text })
        .returning(['id', 'text', 'created_at'])
      await trx.from('channels').where('id', channel.id).update({ last_activity_at: new Date() })
      return created
    })

    if (!message) return response.notFound({ message: 'Do tohto kanála nemôžeš písať.' })
    return response.created({
      data: { id: message.id, from: user.nick, text: message.text, createdAt: message.created_at },
    })
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
