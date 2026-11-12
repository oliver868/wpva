import { reactive } from 'vue'
import { initialChatState } from './chat-data.js'
import { post, request, serverError } from './api.js'

const channelGroup = 'Kanále'

export const state = reactive({
  ...initialChatState,
  channels: [],
  servers: [],
  channelsLoading: false,
  channelsError: ''
})

let requestVersion = 0
let channelSession = 0

const histories = new Map()

function historyOf(channelId) {
  if (!histories.has(channelId)) {
    histories.set(channelId, reactive({
      messages: [],
      hasOlder: true,
      loading: false,
      initialized: false
    }))
  }

  return histories.get(channelId)
}

export function resetChannels() {
  requestVersion++
  channelSession++

  histories.clear()

  state.channels = []
  state.servers = []
  state.channelsLoading = false
  state.channelsError = ''
  state.activeServer = channelGroup
}

export async function refreshChannels() {
  const version = ++requestVersion

  state.channelsLoading = true

  try {
    const { status, body } = await request('channels')

    if (status !== 200) {
      throw new Error(serverError)
    }

    if (version !== requestVersion) {
      return false
    }

    const previousChannels = new Map(state.channels.map(channel => [channel.id, channel]))

    for (const user of body.users ?? []) {
      // svoj stav si drží používateľ sám (môže ho práve meniť)
      if (user.nick !== state.me) {
        setUser(user.nick, user)
      }
    }

    state.servers = body.servers ?? []
    state.channels = body.data.map(channel => {
      const previous = previousChannels.get(channel.id)
      const invitations = []

      if (channel.invitedBy) {
        invitations.push({ nick: state.me, from: channel.invitedBy })
      }

      return {
        ...channel,
        invitations,
        banned: [],
        messages: historyOf(channel.id).messages,
        notify: previous?.notify ?? 'all'
      }
    })

    if (!visibleServers().some(server => server.name === state.activeServer)) {
      state.activeServer = visibleServers()[0]?.name ?? channelGroup
    }

    state.channelsError = ''

    return true
  } catch {
    if (version === requestVersion) {
      state.channelsError = 'Kanály sa nepodarilo načítať.'
    }

    return false
  } finally {
    if (version === requestVersion) {
      state.channelsLoading = false
    }
  }
}

// meno a stav iného používateľa (zo zoznamu kanálov alebo z websocketu)
export function setUser(nick, { name, status }) {
  const user = state.users[nick] ?? { name: nick, color: 'lav' }

  state.users[nick] = { ...user, name: name ?? user.name, status }
}

export function findChannel(name) {
  return state.channels.find(channel => channel.name === name)
}

export function findServerForChannel(channel) {
  if (!channel) {
    return undefined
  }

  return { id: channel.serverId ?? null, name: channel.serverName ?? channelGroup }
}

export function visibleChannels(serverName) {
  if (serverName === undefined) {
    return state.channels
  }

  return state.channels.filter(channel => findServerForChannel(channel).name === serverName)
}

export function visibleServers() {
  const groups = new Map(state.servers.map(server => [
    server.name, { ...server, channels: [], hasInvitation: false }
  ]))

  for (const channel of visibleChannels()) {
    const { name } = findServerForChannel(channel)

    if (!groups.has(name)) {
      groups.set(name, { id: null, name, canCreate: true, channels: [], hasInvitation: false })
    }

    const group = groups.get(name)

    group.channels.push(channel.name)
    group.hasInvitation ||= hasChannelInvitation(channel)
  }

  return [...groups.values()]
}

export function lastMessage(friend) {
  for (let index = friend.threads.length - 1; index >= 0; index -= 1) {
    const messages = friend.threads[index].messages

    if (messages.length) {
      return messages[messages.length - 1].text
    }
  }

  return 'Zatiaľ bez správ'
}

export function channelInvitation(channel, nick = state.me) {
  return channel?.invitations.find(invitation => invitation.nick === nick)
}

export function hasChannelInvitation(channel, nick = state.me) {
  return channelInvitation(channel, nick) !== undefined
}

export function mentionsUser(text, nick = state.me) {
  return new RegExp(`(^|[^a-z0-9_-])@${nick}(?![a-z0-9_-])`, 'i').test(text)
}

async function changeChannel(path, payload, successMessage, goTo) {
  const session = channelSession

  try {
    const { status, body } = await post(path, payload)

    if (session !== channelSession) {
      return { success: false }
    }

    if ([200, 201, 204].includes(status)) {
      await refreshChannels()

      if (session !== channelSession) {
        return { success: false }
      }

      let message = successMessage

      if (typeof successMessage === 'function') {
        message = successMessage(status, body)
      }

      return { success: true, message, goTo, data: body?.data }
    }

    if (status === 404) {
      await refreshChannels()
    }

    return { success: false, message: body?.message ?? serverError }
  } catch {
    return { success: false, message: serverError }
  }
}

export function createChannel(name, isPrivate, serverId) {
  const normalized = name.trim().toLowerCase()

  return changeChannel(
    'channels',
    { name: normalized, private: isPrivate, serverId },
    `Kanál #${normalized} je vytvorený.`,
    '/c/' + normalized
  )
}

export async function createServer(name) {
  const result = await changeChannel('servers', { name: name.trim() }, 'Server je vytvorený.', '/home')

  if (result.success) {
    state.activeServer = result.data.name
  }

  return result
}

export function exitChannel(channel, destroy) {
  let action = 'leave'

  if (destroy) {
    action = 'delete'
  }

  const deletesChannel = destroy || channel.admin === state.me
  let message = `Opustil si #${channel.name}.`

  if (deletesChannel) {
    message = `Kanál #${channel.name} je zrušený.`
  }

  return changeChannel(`channels/${channel.id}/${action}`, {}, message, '/home')
}

export function setChannelVisibility(channel, isPrivate) {
  return changeChannel(`channels/${channel.id}/visibility`, { private: isPrivate })
}

export function acceptChannelInvitation(channel) {
  return changeChannel(
    `channels/${channel.id}/invitation`,
    { accept: true },
    `Prijal si pozvánku do #${channel.name}.`
  )
}

export function declineChannelInvitation(channel) {
  return changeChannel(
    `channels/${channel.id}/invitation`,
    { accept: false },
    `Odmietol si pozvánku do #${channel.name}.`
  )
}

function formatTime(date) {
  return date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
}

function toMessage(message) {
  const time = formatTime(new Date(message.createdAt))

  return { id: message.id, from: message.from, text: message.text, time }
}

function appendMessages(history, messages) {
  const known = new Set(history.messages.map(message => message.id))

  for (const message of messages) {
    if (!known.has(message.id)) {
      history.messages.push(toMessage(message))
      known.add(message.id)
    }
  }

  history.messages.sort((a, b) => a.id - b.id)
}

export async function loadOlderMessages(channel) {
  const history = historyOf(channel.id)

  if (!history.hasOlder || history.loading) {
    return history.hasOlder
  }

  history.loading = true

  try {
    let oldest

    if (history.initialized) {
      oldest = history.messages[0]?.id
    }

    let path = `channels/${channel.id}/messages`

    if (oldest) {
      path += `?before=${oldest}`
    }

    const { status, body } = await request(path)

    if (histories.get(channel.id) !== history) {
      return false
    }

    if (status !== 200) {
      throw new Error('História správ nie je dostupná.')
    }

    appendMessages(history, body.data)

    if (!history.initialized) {
      history.initialized = true
    }

    history.hasOlder = body.hasMore

    return history.hasOlder
  } finally {
    history.loading = false
  }
}

export function receiveMessages(channelId, messages) {
  appendMessages(historyOf(channelId), messages)
}

export async function sendChannelMessage(channel, text) {
  const history = historyOf(channel.id)

  try {
    const { status, body } = await post(`channels/${channel.id}/messages`, { text })

    if (status !== 201) {
      return { success: false, message: body?.message ?? serverError }
    }

    if (histories.get(channel.id) !== history) {
      return { success: false }
    }

    if (history.initialized) {
      appendMessages(history, [body.data])
    } else {
      await loadOlderMessages(channel).catch(() => {})
    }

    return { success: true }
  } catch {
    return { success: false, message: serverError }
  }
}

export function addMessage(messages, text) {
  messages.push({ from: state.me, text, time: formatTime(new Date()) })
}

export function joinChannel(name, isPrivate) {
  const server = visibleServers().find(item => item.name === state.activeServer)

  function successMessage(status) {
    if (status === 201) {
      return `Kanál #${name} je vytvorený.`
    }

    return `Si v #${name}.`
  }

  return changeChannel(
    'channels/join',
    { name, private: isPrivate, serverId: server?.id },
    successMessage,
    '/c/' + name
  )
}

export function inviteToChannel(channel, nick) {
  return changeChannel(
    `channels/${channel.id}/invite`,
    { nick },
    `Pozvánka pre @${nick} do #${channel.name} bola odoslaná.`
  )
}

export function revokeFromChannel(channel, nick) {
  return changeChannel(
    `channels/${channel.id}/revoke`,
    { nick },
    `@${nick} už nemá prístup do #${channel.name}.`
  )
}

export function kickFromChannel(channel, nick) {
  return changeChannel(`channels/${channel.id}/kick`, { nick }, (_, body) => body?.message)
}

const channelNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function runCommand(text, channel) {
  const [command, argument, option, ...rest] = text.trim().split(/\s+/)

  if (command === '/list') {
    if (argument) {
      return { message: 'Použi /list bez ďalších argumentov.' }
    }

    if (!channel) {
      return { message: 'Príkaz /list použi v kanáli.' }
    }

    if (!(await refreshChannels())) {
      return { message: 'Členov sa nepodarilo načítať. Skús to znova.' }
    }

    const current = state.channels.find(item => item.id === channel.id)

    if (!current?.members.includes(state.me) || hasChannelInvitation(current)) {
      return { message: 'Členov môžeš zobraziť iba v kanáli, ktorého si členom.' }
    }

    return { showMembers: true }
  }

  if (command === '/join') {
    const name = argument?.replace(/^#/, '').toLowerCase()

    if (!name || rest.length || (option && option !== 'private')) {
      return { message: 'Použi /join nazov-kanala [private].' }
    }

    if (name.length > 60 || !channelNamePattern.test(name)) {
      return { message: 'Názov kanála môže mať najviac 60 znakov: malé písmená, čísla a pomlčky.' }
    }

    return joinChannel(name, option === 'private')
  }

  if (command === '/invite' || command === '/revoke' || command === '/kick') {
    const nick = argument?.replace(/^@/, '').toLowerCase()

    if (!nick || option) {
      return { message: `Použi ${command} nick.` }
    }

    if (!channel) {
      return { message: `Príkaz ${command} použi v kanáli.` }
    }

    if (command === '/invite') {
      return inviteToChannel(channel, nick)
    }

    if (command === '/revoke') {
      return revokeFromChannel(channel, nick)
    }

    return kickFromChannel(channel, nick)
  }

  return { message: 'Tento príkaz zatiaľ nie je dostupný.' }
}
