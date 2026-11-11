import { watch } from 'vue'
import { state, mentionsUser } from './chat.js'
import { request } from './api.js'

function preferencesKey(id) {
  return 'kanale:notifications:' + id
}

export function notificationPreferences(id) {
  try {
    return JSON.parse(localStorage.getItem(preferencesKey(id)))
  } catch {
    return null
  }
}

export function startMessageNotifications($q, openChannel) {
  const cursors = new Map()
  let active = true
  let loading = false
  const nick = state.me
  const stopPreferences = watch(

    [() => state.notifications, () => state.onlyMentions],
    ([enabled, onlyMentions]) => {
      try {

        localStorage.setItem(preferencesKey(state.profile.id), JSON.stringify({ enabled, onlyMentions }))

      } catch {

        // Nastavenia zostanú funkčné aj pri zakázanom lokálnom úložisku.

      }
    }
  )

  async function poll() {
    if (!active) return

    const channels = state.channels.filter(channel => channel.members.includes(nick))
    const joinedIds = new Set(channels.map(channel => channel.id))

    for (const id of cursors.keys()) {
      if (!joinedIds.has(id)) cursors.delete(id)
    }

    for (const channel of channels) {
      if (!cursors.has(channel.id)) cursors.set(channel.id, { after: channel.latestMessageId })
    }

    if (loading) return

    loading = true

    await Promise.allSettled(channels.map(async channel => {
      const cursor = cursors.get(channel.id)
      const { status, body } = await request(`channels/${channel.id}/messages?after=${cursor.after}`)

      if (!active || state.me !== nick || status !== 200) return

      if (cursors.get(channel.id) !== cursor) return

      if (!state.channels.some(item => item.id === channel.id && item.members.includes(nick))) return

      for (const message of body.data) {
        if ($q.appVisible || !state.notifications || state.users[nick]?.status !== 'online') continue
        if (message.from === nick || (state.onlyMentions && !mentionsUser(message.text, nick))) continue
        if (!('Notification' in window) || Notification.permission !== 'granted') continue

        try {
          const notification = new Notification(`@${message.from} v #${channel.name}`, {
            body: message.text.slice(0, 160),
            icon: '/icons/kanale.svg',
            tag: `${nick}-${channel.id}-${message.id}`
          })
          notification.onclick = () => {

            notification.close()

            if (active) {
              window.focus()
              openChannel('/c/' + channel.name)
            }
          }
        } catch {
          // Zlyhanie systémovej notifikácie nesmie zastaviť príjem ďalších správ.
        }
      }
      cursor.after = body.data.at(-1)?.id ?? cursor.after
    }))
    loading = false
  }

  const stopChannels = watch(

    () => state.channels.filter(channel => channel.members.includes(nick)).map(channel => channel.id).join(','),
    poll,
    { immediate: true }
  )
  
  const timer = window.setInterval(poll, 3000)

  return () => {
    active = false
    window.clearInterval(timer)
    stopChannels()
    stopPreferences()
  }
}
