<template>
  <q-page class="sheet home-sheet" :style-fn="() => ({})">
    <div class="home-content">
      <header class="home-welcome">
        <div class="home-welcome-copy">
          <h1>Ahoj, {{ state.profile.firstName || state.me }}!</h1>
          <p
            >Tu nájdeš svojich priateľov, servery aj kanály na jednom mieste.</p
          >
        </div>
        <q-btn
          class="k-btn yellow home-primary"
          unelevated
          no-caps
          :label="
            continueChannel.name
              ? `Pokračovať v #${continueChannel.name}`
              : 'Zatiaľ nemáš kanál'
          "
          :disable="!continueChannel.name"
          @click="openChannel(continueChannel.server, continueChannel.name)"
        />
      </header>

      <section class="home-notifications" aria-labelledby="notifications-title">
        <header class="home-notifications-heading">
          <h2 id="notifications-title"
            ><q-icon name="notifications" size="22px" aria-hidden="true" />
            Upozornenia</h2
          >
          <span class="chip">{{ unreadCount }} nové</span>
        </header>
        <div v-if="notifications.length" class="home-notification-list">
          <button
            v-for="item in notifications"
            :key="item.id"
            type="button"
            class="home-notification"
            :class="{ unread: !item.read }"
            @click="openNotification(item)"
          >
            <q-icon
              :name="item.invitation ? 'mail' : 'chat_bubble'"
              size="20px"
              aria-hidden="true"
            />
            <span
              ><b>{{ item.title }}</b
              ><small>{{ item.detail }}</small></span
            >
            <q-icon name="arrow_forward" size="18px" aria-hidden="true" />
          </button>
        </div>
        <p v-else class="home-empty">Zatiaľ nemáš žiadne upozornenia.</p>
      </section>

      <div class="home-grid">
        <section
          class="home-section home-servers"
          aria-labelledby="servers-title"
        >
          <header class="home-section-heading pink-heading">
            <h2 id="servers-title">Servery</h2>
            <span class="chip">{{ state.servers.length }}</span>
            <q-btn
              class="k-btn home-add-channel"
              unelevated
              dense
              no-caps
              icon="add"
              label="Vytvoriť kanál"
              @click="openCreate()"
            />
          </header>

          <div v-if="serverGroups.length" class="home-server-list">
            <article
              v-for="server in serverGroups"
              :key="server.name"
              class="home-server"
            >
              <div class="home-server-heading">
                <button
                  class="home-server-name"
                  type="button"
                  :disabled="!server.channels.length"
                  :aria-label="`Otvoriť server ${server.name}`"
                  @click="openChannel(server, server.channels[0]?.name)"
                >
                  <span class="home-server-icon"
                    ><q-icon name="dns" size="19px"
                  /></span>
                  <span>{{ server.name }}</span>
                </button>
                <span class="home-channel-count">
                  {{ server.channels.length }}
                  {{ channelWord(server.channels.length) }}
                </span>
                <q-btn
                  flat
                  dense
                  round
                  icon="add"
                  :aria-label="`Pridať kanál na server ${server.name}`"
                  @click="openCreate(server.name)"
                />
              </div>

              <div v-if="server.channels.length" class="home-channel-list">
                <button
                  v-for="channel in server.channels"
                  :key="channel.name"
                  class="home-channel"
                  type="button"
                  @click="openChannel(server, channel.name)"
                >
                  <q-icon
                    :name="channel.private ? 'lock' : 'tag'"
                    size="14px"
                    aria-hidden="true"
                  />
                  {{ channel.name }}
                  <q-icon
                    v-if="channel.invite"
                    name="mail"
                    size="13px"
                    aria-label="Pozvánka"
                  />
                </button>
              </div>
              <p v-else class="home-empty"
                >V tomto serveri zatiaľ nie sú kanály.</p
              >
            </article>
          </div>
          <p v-else class="home-empty home-section-empty"
            >Zatiaľ nemáš žiadne servery.</p
          >
        </section>

        <section
          class="home-section home-friends"
          aria-labelledby="friends-title"
        >
          <header class="home-section-heading mint-heading">
            <h2 id="friends-title">Priatelia</h2>
            <span class="chip">{{ onlineFriends }} online</span>
          </header>

          <div v-if="state.friends.length" class="home-friend-list">
            <router-link
              v-for="friend in state.friends"
              :key="friend.nick"
              :to="friendRoute(friend)"
              class="home-friend"
            >
              <UserAvatar :nick="friend.nick" />
              <span class="home-friend-info">
                <b>{{ state.users[friend.nick].name }}</b>
                <small>{{ lastMessage(friend) }}</small>
              </span>
              <span
                class="home-friend-status"
                :aria-label="statusLabel(state.users[friend.nick].status)"
              >
                <i
                  class="status"
                  :class="state.users[friend.nick].status"
                  aria-hidden="true"
                />
                <small>{{
                  statusLabel(state.users[friend.nick].status)
                }}</small>
              </span>
            </router-link>
          </div>
          <p v-else class="home-empty home-section-empty"
            >Zatiaľ nemáš žiadnych priateľov.</p
          >
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { state } from '@/stores/chat.js'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const openCreate = inject('openCreateChannel')

const serverGroups = computed(() =>
  state.servers.map(server => ({
    ...server,
    channels: server.channels
      .map(name => state.channels.find(channel => channel.name === name))
      .filter(Boolean)
  }))
)
const invitations = computed(() =>
  state.channels.filter(channel => channel.invite)
)
const notifications = computed(() => [
  ...invitations.value.map(channel => ({
    id: `invite-${channel.name}`,
    title: `Pozvánka do #${channel.name}`,
    detail: `@${channel.admin} ťa pozýva do kanála.`,
    to: `/c/${channel.name}`,
    invitation: true,
    read: false,
    server: serverFor(channel)
  })),
  ...state.notificationFeed
])
const unreadCount = computed(
  () => notifications.value.filter(item => !item.read).length
)
const onlineFriends = computed(
  () =>
    state.friends.filter(
      friend => state.users[friend.nick]?.status === 'online'
    ).length
)
const continueChannel = computed(() => {
  const channel =
    state.channels.find(
      item => item.name === 'general' && item.members.includes(state.me)
    ) ||
    state.channels.find(item => !item.invite && item.members.includes(state.me))
  return {
    name: channel?.name || '',
    server: channel ? serverFor(channel) : null
  }
})

function serverFor(channel) {
  return state.servers.find(server => server.channels.includes(channel.name))
}

function openChannel(server, name) {
  if (!name) return
  if (server) state.activeServer = server.name
  router.push('/c/' + name)
}

function openNotification(item) {
  const destinationChannel = item.to.startsWith('/c/')
    ? state.channels.find(channel => `/c/${channel.name}` === item.to)
    : null
  const server =
    item.server || (destinationChannel && serverFor(destinationChannel))
  if (server) state.activeServer = server.name
  if (!item.invitation) item.read = true
  router.push(item.to)
}

function friendRoute(friend) {
  return '/dm/' + friend.nick + '/' + friend.threads[0]?.id
}

function lastMessage(friend) {
  for (let index = friend.threads.length - 1; index >= 0; index -= 1) {
    const messages = friend.threads[index].messages
    if (messages.length) return messages[messages.length - 1].text
  }
  return 'Zatiaľ bez správ'
}

function channelWord(count) {
  if (count === 1) return 'kanál'
  return count > 1 && count < 5 ? 'kanály' : 'kanálov'
}

function statusLabel(status) {
  return (
    { online: 'Online', dnd: 'Nerušiť', offline: 'Offline' }[status] ||
    'Neznámy stav'
  )
}
</script>
