<template>
  <q-layout view="lHh LpR lFf">
    <!-- ĽAVÝ PANEL -->
    <q-drawer v-model="drawer" show-if-above :width="310">
      <div class="side">
        <router-link class="logo" to="/">kanál<span>!</span></router-link>

        <q-btn
          class="create"
          unelevated
          no-caps
          icon="add"
          label="Vytvoriť kanál"
          @click="showCreate = true"
        />

        <div class="side-lists">
          <!-- q-expansion-item = sekcia, ktorá sa dá rozbaliť / zbaliť (bez JavaScriptu) -->
          <q-expansion-item default-opened dense label="Priatelia" header-class="side-title">
            <router-link
              v-for="f in state.friends"
              :key="f.nick"
              :to="'/dm/' + f.nick"
              class="friend"
            >
              <UserAvatar :nick="f.nick" />
              <div>
                <b>{{ f.nick }}</b>
                <small>{{ f.messages[f.messages.length - 1].text }}</small>
              </div>
            </router-link>
          </q-expansion-item>

          <q-expansion-item default-opened dense label="Servery" header-class="side-title">
            <!-- klik na server ho vyberie; jeho kanály sa ukážu hore v záložkách -->
            <router-link
              v-for="s in state.servers"
              :key="s.name"
              :to="'/c/' + s.channels[0]"
              class="server"
              :class="{ active: state.activeServer === s.name }"
              @click="state.activeServer = s.name"
            >
              <q-icon name="dns" size="20px" />
              {{ s.name }}
            </router-link>
          </q-expansion-item>
        </div>

        <!-- MOJE OSOBNÉ NASTAVENIA (aplikácia) -->
        <div class="me-box">
          <UserAvatar :nick="state.me" />
          <div>
            <b>@{{ state.me }}</b>
            <small>{{ state.profile.firstName }} {{ state.profile.lastName }}</small>
          </div>
          <div class="status-switch">
            <button
              v-for="s in ['online', 'dnd', 'offline']"
              :key="s"
              :class="{ active: state.users[state.me].status === s }"
              @click="state.users[state.me].status = s"
            >
              <i class="status" :class="s" /> {{ s }}
            </button>
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
          <span class="logo">kanál<span>!</span></span>
        </div>

        <div class="top-row">
          <!-- ZÁLOŽKY = kanály vybraného servera -->
          <nav class="tabs">
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
          </nav>

          <!-- NOTIFIKÁCIE A NASTAVENIA pre otvorený kanál alebo kamaráta -->
          <div v-if="current" class="top-actions">
            <q-btn
              class="tab"
              unelevated
              dense
              :icon="current.notify === 'off' ? 'notifications_off' : 'notifications'"
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

            <q-btn class="tab" unelevated dense icon="tune" aria-label="Nastavenia">
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
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, findChannel, findServer, runCommand } from '@/stores/chat.js'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const drawer = ref(false)
const showCreate = ref(false)
const newName = ref('')
const newPrivate = ref(false)

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
const current = computed(() => channel.value || friend.value)
const title = computed(() => (channel.value ? '#' + channel.value.name : '@' + friend.value.nick))
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

function removeFriend() {
  $q.notify(`@${friend.value.nick} odstránený z priateľov`)
  state.friends.splice(state.friends.indexOf(friend.value), 1)
  router.push('/')
}
</script>
