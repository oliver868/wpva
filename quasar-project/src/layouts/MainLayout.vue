<template>
  <q-layout view="lHh LpR lFf">
    <!-- ĽAVÝ PANEL -->
    <q-drawer v-model="drawer" show-if-above :width="310">
      <div class="side">
        <router-link class="logo" to="/">
          <img class="logo-icon" src="/icons/kanale.svg" alt="" aria-hidden="true" />
          <span class="logo-text">Kanále</span>
        </router-link>

        <q-btn
          class="create"
          unelevated
          no-caps
          icon="add"
          label="Vytvoriť kanál"
          @click="showCreate = true"
        />

        <q-input
          v-model="sidebarSearch"
          class="k-input side-search"
          borderless
          dense
          clearable
          placeholder="Priatelia a servery"
          aria-label="Hľadať priateľov a servery"
        >
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>

        <div class="side-lists">
          <q-expansion-item
            v-model="friendsExpanded"
            dense
            label="Priatelia"
            header-class="side-title"
          >
            <router-link
              v-for="f in filteredFriends"
              :key="f.nick"
              :to="friendRoute(f)"
              class="friend"
              :class="{ active: route.params.nick === f.nick }"
            >
              <UserAvatar :nick="f.nick" />
              <div>
                <b>{{ f.nick }}</b>
                <small>{{ lastMessage(f) }}</small>
              </div>
            </router-link>
            <p v-if="sidebarQuery && !filteredFriends.length" class="side-empty">
              Nenašli sa priatelia
            </p>
          </q-expansion-item>

          <q-expansion-item
            v-model="serversExpanded"
            dense
            label="Servery"
            header-class="side-title"
          >
            <!-- klik na server ho vyberie; jeho kanály sa ukážu hore v záložkách -->
            <router-link
              v-for="s in filteredServers"
              :key="s.name"
              :to="'/c/' + s.channels[0]"
              class="server"
              :class="{ active: state.activeServer === s.name }"
              @click="state.activeServer = s.name"
            >
              <q-icon name="dns" size="20px" />
              {{ s.name }}
            </router-link>
            <p v-if="sidebarQuery && !filteredServers.length" class="side-empty">
              Nenašli sa servery
            </p>
          </q-expansion-item>
        </div>

        <!-- MOJE OSOBNÉ NASTAVENIA (aplikácia) -->
        <div class="me-box">
          <q-btn
            class="profile-avatar-trigger"
            flat
            round
            dense
            :aria-label="`Zmeniť stav používateľa: ${state.users[state.me].status}`"
          >
            <UserAvatar :nick="state.me" />
            <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
              <q-list class="profile-status-menu">
                <q-item-label header>Stav používateľa</q-item-label>
                <q-item
                  v-for="s in ['online', 'dnd', 'offline']"
                  :key="s"
                  tag="button"
                  clickable
                  v-close-popup
                  class="profile-status-option"
                  :class="{ active: state.users[state.me].status === s }"
                  :aria-pressed="state.users[state.me].status === s"
                  @click="state.users[state.me].status = s"
                >
                  <q-item-section avatar>
                    <i class="status" :class="s" aria-hidden="true" />
                  </q-item-section>
                  <q-item-section>{{ s }}</q-item-section>
                  <q-item-section v-if="state.users[state.me].status === s" side>
                    <q-icon name="check" size="16px" aria-hidden="true" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <div>
            <b>@{{ state.me }}</b>
            <small>{{ state.profile.firstName }} {{ state.profile.lastName }}</small>
          </div>
        </div>
        <q-btn
          class="k-btn"
          unelevated
          no-caps
          align="left"
          icon="settings"
          label="Nastavenia aplikácie"
          to="/settings"
        />
      </div>
    </q-drawer>

    <q-page-container>
      <div class="main">
        <!-- na mobile: tlačidlo na otvorenie ľavého panela -->
        <div class="mobile-bar lt-md">
          <q-btn class="k-btn" unelevated dense icon="menu" @click="drawer = !drawer" />
          <span class="logo">
            <img class="logo-icon" src="/icons/kanale.svg" alt="" aria-hidden="true" />
            <span class="logo-text">Kanále</span>
          </span>
        </div>

        <div class="top-row">
          <!-- Kanál zobrazuje kanály servera; kamarát zobrazuje len jeho vlastné thready. -->
          <nav class="tabs">
            <template v-if="channel">
              <router-link
                v-for="c in tabs"
                :key="c.name"
                :to="'/c/' + c.name"
                class="tab"
                :class="{ invite: c.invite }"
              >
                <q-icon v-if="c.private" name="lock" size="14px" />
                <span v-else>#</span>
                {{ c.name }}
              </router-link>
            </template>
            <template v-else-if="friend">
              <router-link
                v-for="thread in friend.threads"
                :key="thread.id"
                :to="friendRoute(friend, thread)"
                class="tab thread-tab"
              >
                <q-icon name="alternate_email" size="14px" />
                {{ thread.title }}
              </router-link>
            </template>
            <router-link v-else-if="route.name === 'home'" to="/home" class="tab">
              <q-icon name="dashboard" size="16px" />
              Prehľad
            </router-link>
          </nav>

          <q-btn
            v-if="friend"
            class="tab new-thread"
            unelevated
            dense
            no-caps
            icon="add"
            :label="$q.screen.lt.sm ? 'Thread' : 'Nový thread'"
            aria-label="Vytvoriť nový thread pre tohto kamaráta"
            @click="showThreadDialog = true"
          />

          <!-- NOTIFIKÁCIE A NASTAVENIA pre otvorený kanál alebo kamaráta -->
          <div v-if="current" class="top-actions">
            <q-btn
              class="tab"
              unelevated
              dense
              :icon="current.notify === 'off' ? 'notifications_off' : 'notifications'"
              :label="$q.screen.lt.sm ? '' : 'Notifikácie'"
              aria-label="Notifikácie"
            >
              <q-menu anchor="bottom right" self="top right">
                <div class="menu-box">
                  <b>Notifikácie · {{ title }}</b>
                  <q-option-group
                    v-model="current.notify"
                    color="positive"
                    :options="[
                      { label: 'Všetky správy', value: 'all' },
                      { label: 'Iba @zmienky', value: 'mentions' },
                      { label: 'Stlmiť', value: 'off' }
                    ]"
                  />
                </div>
              </q-menu>
            </q-btn>

            <q-btn
              class="tab"
              unelevated
              dense
              icon="tune"
              :label="$q.screen.lt.sm ? '' : 'Nastavenia'"
              aria-label="Nastavenia"
            >
              <q-menu anchor="bottom right" self="top right">
                <div class="menu-box">
                  <b>Nastavenia · {{ title }}</b>

                  <!-- kanál / server -->
                  <template v-if="channel">
                    <span>Server: {{ serverName }}</span>
                    <span>Typ: {{ channel.private ? 'súkromný' : 'verejný' }}</span>
                    <span>Správca: @{{ channel.admin }}</span>
                    <span>Členov: {{ channel.members.length }}</span>
                    <q-btn v-close-popup class="k-btn" unelevated no-caps label="Opustiť kanál" @click="run('/cancel')" />
                    <q-btn
                      v-if="channel.admin === state.me"
                      v-close-popup
                      class="k-btn danger"
                      unelevated
                      no-caps
                      label="Zrušiť kanál"
                      @click="run('/quit')"
                    />
                  </template>

                  <!-- kamarát -->
                  <template v-else>
                    <span>{{ state.users[friend.nick].name }}</span>
                    <span>Stav: {{ state.users[friend.nick].status }}</span>
                    <q-btn
                      v-close-popup
                      class="k-btn danger"
                      unelevated
                      no-caps
                      label="Odstrániť z priateľov"
                      @click="removeFriend"
                    />
                  </template>
                </div>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <router-view />
      </div>
    </q-page-container>

    <!-- DIALÓG: NOVÝ KANÁL -->
    <q-dialog v-model="showCreate">
      <q-form class="dialog" @submit="createChannel">
        <h2>Nový kanál</h2>
        <q-input
          v-model="newName"
          class="k-input"
          borderless
          dense
          prefix="#"
          placeholder="nazov-kanala"
          :rules="[v => !!v || 'Zadaj názov']"
        />
        <q-toggle v-model="newPrivate" label="Súkromný kanál" color="positive" />
        <p class="hint">
          To isté ako príkaz /join {{ newName || 'nazov' }}{{ newPrivate ? ' private' : '' }}
        </p>
        <div class="row justify-end q-gutter-sm">
          <q-btn v-close-popup class="k-btn" unelevated no-caps label="Zrušiť" />
          <q-btn class="k-btn dark" unelevated no-caps type="submit" label="Vytvoriť" />
        </div>
      </q-form>
    </q-dialog>

    <!-- DIALÓG: NOVÝ THREAD V PRIAMOM CHATE -->
    <q-dialog v-model="showThreadDialog">
      <q-form class="dialog" @submit="createThread">
        <h2>Nový thread</h2>
        <q-input
          v-model="newThreadName"
          class="k-input"
          borderless
          dense
          maxlength="40"
          label="Názov threadu"
          prefix="@"
          placeholder="nazov-threadu"
          :rules="[v => !!v?.trim() || 'Zadaj názov threadu']"
        />
        <p class="hint">História správ bude patriť iba do chatu s @{{ friend?.nick }}.</p>
        <div class="row justify-end q-gutter-sm">
          <q-btn v-close-popup class="k-btn" unelevated no-caps label="Zrušiť" />
          <q-btn class="k-btn dark" unelevated no-caps type="submit" label="Vytvoriť" />
        </div>
      </q-form>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, findChannel, findServer, runCommand } from '@/stores/chat.js'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const drawer = ref(false)
const showCreate = ref(false)
const showThreadDialog = ref(false)
const newName = ref('')
const newThreadName = ref('')
const newPrivate = ref(false)
const sidebarSearch = ref('')
const friendsExpanded = ref(true)
const serversExpanded = ref(true)

const sidebarQuery = computed(() => normalizeSearch(sidebarSearch.value))
const filteredFriends = computed(() =>
  state.friends.filter(friend =>
    normalizeSearch(`${friend.nick} ${state.users[friend.nick]?.name || ''}`).includes(
      sidebarQuery.value,
    ),
  ),
)
const filteredServers = computed(() =>
  state.servers.filter(server => normalizeSearch(server.name).includes(sidebarQuery.value)),
)

function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('sk').trim()
}

watch(sidebarSearch, value => {
  if (value.trim()) {
    friendsExpanded.value = true
    serversExpanded.value = true
  }
})

// záložky: kanály vybraného servera, v ktorých som členom alebo mám pozvánku
const tabs = computed(() =>
  state.channels.filter(
    c =>
      findServer(state.activeServer).channels.includes(c.name) &&
      (c.invite || c.members.includes(state.me))
  )
)

// čo je práve otvorené: kanál (ak som členom) alebo chat s kamarátom
const channel = computed(() => {
  const c = findChannel(route.params.name)
  return c && c.members.includes(state.me) ? c : null
})
const friend = computed(() => state.friends.find(f => f.nick === route.params.nick))
const activeThread = computed(
  () => friend.value?.threads.find(t => t.id === route.params.threadId) || friend.value?.threads[0],
)
const current = computed(() => channel.value || activeThread.value)
const title = computed(() =>
  channel.value ? '#' + channel.value.name : '@' + friend.value.nick + ' · ' + activeThread.value.title,
)
const serverName = computed(
  () => state.servers.find(s => s.channels.includes(channel.value.name))?.name || 'žiadny'
)

// spustí príkaz (rovnako ako z príkazového riadku) a ukáže výsledok
function run(text) {
  const result = runCommand(text, channel.value)
  $q.notify(result.message)
  if (result.goTo) router.push(result.goTo)
}

// vytvorenie kanála cez dialóg robí presne to isté ako príkaz /join
function createChannel() {
  run('/join ' + newName.value + (newPrivate.value ? ' private' : ''))
  showCreate.value = false
  newName.value = ''
}

function friendRoute(person, thread = person.threads[0]) {
  return '/dm/' + person.nick + '/' + thread.id
}

function lastMessage(person) {
  for (let index = person.threads.length - 1; index >= 0; index -= 1) {
    const messages = person.threads[index].messages
    if (messages.length) return messages[messages.length - 1].text
  }
  return 'Zatiaľ bez správ'
}

function createThread() {
  const name = newThreadName.value.trim()
  if (!name || !friend.value) return

  const alreadyExists = friend.value.threads.some(
    thread => thread.title.toLocaleLowerCase('sk') === name.toLocaleLowerCase('sk'),
  )
  if (alreadyExists) {
    $q.notify('Thread s týmto názvom už existuje')
    return
  }

  const thread = {
    id: `thread-${Date.now().toString(36)}-${friend.value.threads.length}`,
    title: name,
    notify: 'all',
    messages: [],
  }
  friend.value.threads.push(thread)
  showThreadDialog.value = false
  newThreadName.value = ''
  router.push(friendRoute(friend.value, thread))
  $q.notify(`Thread „${name}“ vytvorený pre @${friend.value.nick}`)
}

function removeFriend() {
  $q.notify(`@${friend.value.nick} odstránený z priateľov`)
  state.friends.splice(state.friends.indexOf(friend.value), 1)
  router.push('/')
}
</script>
