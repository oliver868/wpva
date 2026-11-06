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

export function resetChannels() {
  requestVersion++
  channelSession++
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
        messages: previous?.messages ?? [],
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
    if (status === 201 || status === 204) {
      await refreshChannels()
      if (session !== channelSession) return { success: false }
      return { success: true, message: successMessage, goTo }
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

export function addMessage(messages, text) {
  const time = new Date().toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  })
  messages.push({ from: state.me, text, time })
}

export function runCommand(text) {
  if (text.trim() === '/list') return { message: 'Zoznam členov kanála.' }
  return { message: 'Tento príkaz zatiaľ nie je dostupný.' }
}
