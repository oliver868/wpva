import { reactive } from 'vue'
import { initialChatState } from './chat-data.js'
import { post, request, serverError } from './api.js'

const channelGroup = 'Kanále'

export const state = reactive({
  ...initialChatState,
  channels: [],
  channelsLoading: false,
  channelsError: ''
})

let requestVersion = 0
let channelSession = 0

// správy kanála podľa id; prežijú obnovenie zoznamu kanálov (refreshChannels)
const histories = new Map()
function historyOf(channelId) {
  if (!histories.has(channelId)) {
    histories.set(channelId, reactive({ messages: [], hasOlder: true, loading: false }))
  }
  return histories.get(channelId)
}

export function resetChannels() {
  requestVersion++
  channelSession++
  histories.clear()
  state.channels = []
  state.channelsLoading = false
  state.channelsError = ''
  state.activeServer = channelGroup
}

export async function refreshChannels() {
  const version = ++requestVersion
  state.channelsLoading = true
  try {
    const { status, body } = await request('channels')
    if (status !== 200) throw new Error(serverError)
    if (version !== requestVersion) return

    const previousChannels = new Map(state.channels.map(channel => [channel.id, channel]))
    state.channels = body.data.map(channel => {
      const previous = previousChannels.get(channel.id)
      return {
        ...channel,
        invitations: channel.invitedBy ? [{ nick: state.me, from: channel.invitedBy }] : [],
        banned: [],
        messages: historyOf(channel.id).messages,
        notify: previous?.notify ?? 'all'
      }
    })
    if (!visibleChannels(state.activeServer).length) {
      state.activeServer = findServerForChannel(state.channels[0])?.name ?? channelGroup
    }
    state.channelsError = ''
  } catch {
    if (version === requestVersion) state.channelsError = 'Kanály sa nepodarilo načítať.'
  } finally {
    if (version === requestVersion) state.channelsLoading = false
  }
}

export function findChannel(name) {
  return state.channels.find(channel => channel.name === name)
}

export function findServerForChannel(channel) {
  return channel ? { name: channel.serverName ?? channelGroup } : undefined
}

export function visibleChannels(serverName) {
  return serverName === undefined
    ? state.channels
    : state.channels.filter(channel => findServerForChannel(channel).name === serverName)
}

export function visibleServers() {
  const groups = new Map()
  for (const channel of visibleChannels()) {
    const { name } = findServerForChannel(channel)
    if (!groups.has(name)) groups.set(name, { name, channels: [], hasInvitation: false })
    const group = groups.get(name)
    group.channels.push(channel.name)
    group.hasInvitation ||= hasChannelInvitation(channel)
  }
  return [...groups.values()]
}

export function lastMessage(friend) {
  for (let index = friend.threads.length - 1; index >= 0; index -= 1) {
    const messages = friend.threads[index].messages
    if (messages.length) return messages[messages.length - 1].text
  }
  return 'Zatiaľ bez správ'
}

export function channelInvitation(channel, nick = state.me) {
  return channel?.invitations.find(invitation => invitation.nick === nick)
}

export function hasChannelInvitation(channel, nick = state.me) {
  return channelInvitation(channel, nick) !== undefined
}

async function changeChannel(path, payload, successMessage, goTo) {
  const session = channelSession
  try {
    const { status, body } = await post(path, payload)
    if (session !== channelSession) return { success: false }
    if (status === 200 || status === 201 || status === 204) {
      await refreshChannels()
      if (session !== channelSession) return { success: false }
      // správa môže závisieť od odpovede (napr. /join: vytvorený = 201, pripojený = 200)
      const message =
        typeof successMessage === 'function' ? successMessage(status, body) : successMessage
      return { success: true, message, goTo }
    }
    if (status === 404) await refreshChannels()
    return { success: false, message: body?.message ?? serverError }
  } catch {
    return { success: false, message: serverError }
  }
}

export function createChannel(name, isPrivate) {
  const normalized = name.trim().toLowerCase()
  return changeChannel('channels', { name: normalized, private: isPrivate },
    `Kanál #${normalized} je vytvorený.`, '/c/' + normalized)
}

export function exitChannel(channel, destroy) {
  const deletesChannel = destroy || channel.admin === state.me
  return changeChannel(`channels/${channel.id}/${destroy ? 'delete' : 'leave'}`, {},
    deletesChannel ? `Kanál #${channel.name} je zrušený.` : `Opustil si #${channel.name}.`, '/home')
}

export function setChannelVisibility(channel, isPrivate) {
  return changeChannel(`channels/${channel.id}/visibility`, { private: isPrivate })
}

export function acceptChannelInvitation(channel) {
  return changeChannel(`channels/${channel.id}/invitation`, { accept: true },
    `Prijal si pozvánku do #${channel.name}.`)
}

export function declineChannelInvitation(channel) {
  return changeChannel(`channels/${channel.id}/invitation`, { accept: false },
    `Odmietol si pozvánku do #${channel.name}.`)
}

function toMessage(message) {
  const time = new Date(message.createdAt).toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  })
  return { id: message.id, from: message.from, text: message.text, time }
}

// pridá správy zo servera, každú iba raz (odoslaná správa môže prísť aj pri obnovení)
function appendMessages(history, messages) {
  const known = new Set(history.messages.map(message => message.id))
  for (const message of messages) {
    if (!known.has(message.id)) history.messages.push(toMessage(message))
  }
}

// staršie správy pre infinite scroll; vráti, či na serveri ešte nejaké sú
export async function loadOlderMessages(channel) {
  const history = historyOf(channel.id)
  if (!history.hasOlder || history.loading) return history.hasOlder
  history.loading = true
  try {
    const oldest = history.messages[0]?.id
    const { status, body } = await request(
      `channels/${channel.id}/messages` + (oldest ? `?before=${oldest}` : '')
    )
    if (status !== 200) return history.hasOlder
    history.messages.unshift(...body.data.map(toMessage))
    history.hasOlder = body.hasMore
    return history.hasOlder
  } catch {
    return history.hasOlder
  } finally {
    history.loading = false
  }
}

// nové správy od ostatných (volá sa pravidelne, kým je kanál otvorený)
export async function loadNewMessages(channel) {
  const history = historyOf(channel.id)
  // kým sa nenačíta prvá strana, nové správy nemajú na čo nadviazať
  if (history.loading || (!history.messages.length && history.hasOlder)) return
  const newest = history.messages[history.messages.length - 1]?.id ?? 0
  try {
    const { status, body } = await request(`channels/${channel.id}/messages?after=${newest}`)
    if (status === 200) appendMessages(history, body.data)
  } catch {
    // skúsi sa znova pri ďalšom obnovení
  }
}

export async function sendChannelMessage(channel, text) {
  try {
    const { status, body } = await post(`channels/${channel.id}/messages`, { text })
    if (status !== 201) return { success: false, message: body?.message ?? serverError }
    appendMessages(historyOf(channel.id), [body.data])
    return { success: true }
  } catch {
    return { success: false, message: serverError }
  }
}

export function addMessage(messages, text) {
  const time = new Date().toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  })
  messages.push({ from: state.me, text, time })
}

export function joinChannel(name, isPrivate) {
  return changeChannel('channels/join', { name, private: isPrivate },
    status => status === 201 ? `Kanál #${name} je vytvorený.` : `Si v #${name}.`, '/c/' + name)
}

export function inviteToChannel(channel, nick) {
  return changeChannel(`channels/${channel.id}/invite`, { nick },
    `Pozvánka pre @${nick} do #${channel.name} bola odoslaná.`)
}

export function revokeFromChannel(channel, nick) {
  return changeChannel(`channels/${channel.id}/revoke`, { nick },
    `@${nick} už nemá prístup do #${channel.name}.`)
}

// hlášku (počet hlasov alebo ban) posiela server
export function kickFromChannel(channel, nick) {
  return changeChannel(`channels/${channel.id}/kick`, { nick }, (_, body) => body?.message)
}

export async function runCommand(text, channel) {
  const [command, argument, option, ...rest] = text.trim().split(/\s+/)

  if (command === '/list') return { message: 'Zoznam členov kanála.' }

  if (command === '/join') {
    const name = argument?.replace(/^#/, '').toLowerCase()
    if (!name || rest.length || (option && option !== 'private')) {
      return { message: 'Použi /join nazov-kanala [private].' }
    }
    if (name.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      return { message: 'Názov kanála môže mať najviac 60 znakov: malé písmená, čísla a pomlčky.' }
    }
    return joinChannel(name, option === 'private')
  }

  if (command === '/invite' || command === '/revoke' || command === '/kick') {
    const nick = argument?.replace(/^@/, '').toLowerCase()
    if (!nick || option) return { message: `Použi ${command} nick.` }
    if (!channel) return { message: `Príkaz ${command} použi v kanáli.` }
    if (command === '/invite') return inviteToChannel(channel, nick)
    if (command === '/revoke') return revokeFromChannel(channel, nick)
    return kickFromChannel(channel, nick)
  }

  return { message: 'Tento príkaz zatiaľ nie je dostupný.' }
}
