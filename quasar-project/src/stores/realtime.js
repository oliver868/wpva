import { shallowRef, watch } from 'vue'
import { Socket } from '@rlanz/socket/client'
import { state, refreshChannels, receiveMessages, setUser } from './chat.js'
import { post, request } from './api.js'
import { startMessageNotifications } from './notifications.js'

// aktuálne spojenie (null, kým nie je používateľ prihlásený)
export const realtimeSocket = shallowRef(null)

function isOffline() {
  return state.users[state.me]?.status === 'offline'
}

// stavová lišta „píše…“ pre jeden kanál
export function joinTyping(channelId, onTyping) {
  const channel = realtimeSocket.value.channel('channels/:id', { id: String(channelId) })

  channel.listen('typing', data => {
    // v stave offline neprichádza nič
    if (!isOffline()) {
      onTyping(data)
    }
  })
  channel.subscribe().catch(() => {})

  function send(text) {
    if (channel.active) {
      channel.send('typing', { text: isOffline() ? '' : text })
    }
  }

  return {
    send,
    stop() {
      send('')
      channel.unsubscribe().catch(() => {})
    }
  }
}

export function startRealtime($q, openChannel) {
  const socket = new Socket()
  const account = socket.channel('users/:id', { id: String(state.profile.id) })
  realtimeSocket.value = socket
  const notifications = startMessageNotifications($q, openChannel)
  const cursors = new Map()

  let active = true
  let connected = false
  let refreshing = false
  let refreshAgain = false

  function deliver(channel, cursor, messages) {
    receiveMessages(channel.id, messages)

    for (const message of messages) {
      if (message.id <= cursor.after || cursor.received.has(message.id)) {
        continue
      }

      cursor.received.add(message.id)
      notifications.notify(channel, message)
    }
  }

  async function syncMessages(channelId) {
    const cursor = cursors.get(channelId)

    // offline používateľ správy nenačítava, dostane ich po prepnutí na online
    if (!active || !cursor || isOffline()) {
      return
    }

    cursor.dirty = true

    if (cursor.loading) {
      return
    }

    cursor.loading = true

    try {
      while (active && cursor.dirty && cursors.get(channelId) === cursor) {
        cursor.dirty = false

        const { status, body } = await request(
          `channels/${channelId}/messages?after=${cursor.after}`
        )
        const channel = state.channels.find(
          item => item.id === channelId && item.members.includes(state.me)
        )

        if (!active || cursors.get(channelId) !== cursor || !channel) {
          return
        }

        if (status !== 200) {
          throw new Error('Správy sa nepodarilo načítať.')
        }

        deliver(channel, cursor, body.data)
        cursor.after = body.data.at(-1)?.id ?? cursor.after

        for (const id of cursor.received) {
          if (id <= cursor.after) {
            cursor.received.delete(id)
          }
        }

        if (body.data.length === 100) {
          cursor.dirty = true
        }
      }
    } catch {
      cursor.dirty = true
    } finally {
      cursor.loading = false
    }
  }

  const stopChannels = watch(
    () =>
      state.channels
        .filter(item => item.members.includes(state.me))
        .map(item => [item.id, item.latestMessageId]),
    channels => {
      const ids = new Set(channels.map(([id]) => id))

      for (const id of cursors.keys()) {
        if (!ids.has(id)) {
          cursors.delete(id)
        }
      }

      for (const [id, latest] of channels) {
        if (!cursors.has(id)) {
          cursors.set(id, { after: latest, received: new Set(), loading: false, dirty: false })
        }
      }
    },
    { immediate: true, flush: 'sync' }
  )

  async function refresh() {
    refreshAgain = true

    if (!active || refreshing) {
      return
    }

    refreshing = true

    try {
      while (active && refreshAgain) {
        refreshAgain = false

        await refreshChannels()

        if (active) {
          const channelIds = [...cursors.keys()]

          await Promise.all(channelIds.map(syncMessages))
        }
      }
    } finally {
      refreshing = false
    }
  }

  account.listen('messageCreated', async ({ channelId, message }) => {
    if (!active || isOffline()) {
      return
    }

    if (!cursors.has(channelId)) {
      await refresh()
    }

    const cursor = cursors.get(channelId)
    const channel = state.channels.find(
      item => item.id === channelId && item.members.includes(state.me)
    )

    if (active && cursor && channel) {
      deliver(channel, cursor, [message])
    }
  })

  account.listen('channelsChanged', () => {
    void refresh()
  })

  // iný používateľ zmenil stav (alebo zavrel / otvoril aplikáciu)
  account.listen('statusChanged', ({ nick, status }) => {
    if (active && nick !== state.me) {
      setUser(nick, { status })
    }
  })

  // svoj stav uložíme na server; po prepnutí na online sa kanály aktualizujú
  const stopStatus = watch(
    () => state.users[state.me]?.status,
    async status => {
      try {
        const { status: code } = await post('account/status', { status })

        if (code !== 204) {
          throw new Error()
        }
      } catch {
        $q.notify('Stav sa nepodarilo uložiť. Skús to znova.')
        return
      }

      if (active && status === 'online') {
        await refresh()
      }
    }
  )

  const stopState = socket.onStateChange(async status => {
    connected = false

    if (status !== 'connected' || !active) {
      return
    }

    try {
      await account.subscribe()

      if (!active) {
        return
      }

      connected = true
      await refresh()
    } catch {

    }
  })

  void refresh()
  void socket.connect().catch(() => {})

  const retry = window.setInterval(() => {
    if (!connected) {
      void refresh()
    } else {
      for (const [id, cursor] of cursors) {
        if (cursor.dirty) {
          void syncMessages(id)
        }
      }
    }
  }, 5000)

  return () => {
    active = false

    window.clearInterval(retry)
    stopState()
    stopChannels()
    stopStatus()
    notifications.stop()
    socket.disconnect()
    realtimeSocket.value = null
  }
}
