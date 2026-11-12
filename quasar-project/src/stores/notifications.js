import { watch } from 'vue'
import { state, mentionsUser } from './chat.js'

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
  let active = true
  const nick = state.me

  const stopPreferences = watch(
    [() => state.notifications, () => state.onlyMentions],
    ([enabled, onlyMentions]) => {
      try {
        localStorage.setItem(
          preferencesKey(state.profile.id),
          JSON.stringify({ enabled, onlyMentions })
        )
      } catch {
        // Nastavenia fungujú aj pri zakázanom lokálnom úložisku.
      }
    }
  )

  return {
    notify(channel, message) {
      if (
        !active ||
        $q.appVisible ||
        !state.notifications ||
        state.users[nick]?.status !== 'online'
      ) {
        return
      }

      if (
        message.from === nick ||
        (state.onlyMentions && !mentionsUser(message.text, nick))
      ) {
        return
      }

      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return
      }

      try {
        const notification = new Notification(
          `@${message.from} v #${channel.name}`,
          {
            body: message.text.slice(0, 160),
            icon: '/icons/kanale.svg',
            tag: `${nick}-${channel.id}-${message.id}`
          }
        )
        notification.onclick = () => {
          notification.close()

          if (active) {
            window.focus()
            openChannel('/c/' + channel.name)
          }
        }
      } catch {
        // Zlyhanie systémovej notifikácie nesmie zastaviť príjem správ.
      }
    },
    stop() {
      active = false

      stopPreferences()
    }
  }
}
