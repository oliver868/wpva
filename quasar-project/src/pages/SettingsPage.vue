<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <header class="sheet-header">
      <h1>Nastavenia</h1>
      <span class="chip">@{{ state.me }}</span>
    </header>

    <!-- všetko je cez v-model priamo v store, zmena sa prejaví hneď -->
    <div class="panels">
      <section class="panel">
        <h3 class="pink">Profil</h3>
        <label>Meno</label>
        <q-input
          v-model="state.profile.firstName"
          class="k-input"
          borderless
          dense
        />
        <label>Priezvisko</label>
        <q-input
          v-model="state.profile.lastName"
          class="k-input"
          borderless
          dense
        />
        <label>Email</label>
        <q-input
          v-model="state.profile.email"
          class="k-input"
          borderless
          dense
          type="email"
        />
        <p class="hint"
          >NickName @{{ state.me }} je unikátny a nedá sa zmeniť.</p
        >
      </section>

      <section class="panel">
        <h3 class="mint">Môj stav</h3>
        <q-option-group
          v-model="state.users[state.me].status"
          color="positive"
          :options="[
            { label: 'Online – správy aj notifikácie', value: 'online' },
            { label: 'Nerušiť – bez notifikácií', value: 'dnd' },
            { label: 'Offline – neprichádzajú správy', value: 'offline' }
          ]"
        />
      </section>

      <section class="panel">
        <h3 class="yellow">Notifikácie</h3>
        <q-toggle
          v-model="state.notifications"
          color="positive"
          label="Notifikácie o nových správach"
        />
        <q-toggle
          v-model="state.onlyMentions"
          color="positive"
          :label="'Iba správy pre mňa (@' + state.me + ')'"
        />
        <p class="hint">Notifikácia príde, iba keď appka nie je viditeľná.</p>

        <!-- ako vyzerá systémová notifikácia novej správy -->
        <label>Ukážka systémovej notifikácie</label>
        <div
          class="system-notification"
          aria-label="Ukážka systémovej notifikácie"
        >
          <img
            src="/icons/kanale.svg"
            alt=""
            class="system-notification-icon"
          />
          <div class="system-notification-body">
            <div class="system-notification-app">
              <span>Kanále</span><span>teraz</span>
            </div>
            <b>@mara v #general</b>
            <p>@dano pošleš mi potom link na repo?</p>
          </div>
        </div>
        <p class="hint">{{ notificationHint }}</p>
        <q-btn
          class="k-btn"
          unelevated
          no-caps
          icon="notifications_active"
          label="Vyskúšať notifikáciu"
          @click="testNotification"
        />
      </section>

      <section class="panel">
        <h3 class="lav">Vzhľad chatu</h3>
        <label for="chat-color">Farba správ</label>
        <q-select
          id="chat-color"
          v-model="state.chatAppearance.color"
          class="k-input"
          borderless
          dense
          emit-value
          map-options
          :options="colorOptions"
        />
        <label for="chat-font">Písmo správ</label>
        <q-select
          id="chat-font"
          v-model="state.chatAppearance.font"
          class="k-input"
          borderless
          dense
          emit-value
          map-options
          :options="fontOptions"
        />
        <p class="hint">Zmeny sa hneď prejavia vo všetkých chatoch.</p>
      </section>

      <section class="panel">
        <h3 class="lav">Účet</h3>
        <p
          >Prihlásený ako <b>{{ state.profile.email }}</b></p
        >
        <q-btn
          class="k-btn danger"
          unelevated
          no-caps
          icon="logout"
          label="Odhlásiť sa"
          to="/login"
          @click="signedIn = false"
        />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { state } from '@/stores/chat.js'
import { signedIn } from '@/stores/auth.js'

const $q = useQuasar()

// vysvetlenie, či a kedy notifikácia príde podľa nastavení a stavu
const notificationHint = computed(() => {
  if (!state.notifications) return 'Notifikácie máš vypnuté.'
  if (state.users[state.me].status === 'dnd')
    return 'Máš stav Nerušiť, notifikácie teraz neprídu.'
  if (state.users[state.me].status === 'offline')
    return 'Si offline, správy ani notifikácie neprichádzajú.'
  if (state.onlyMentions)
    return `Notifikácia príde iba pri správe pre @${state.me}.`
  return 'Notifikácia príde pri každej novej správe.'
})

// skutočná notifikácia prehliadača – ukáže sa, iba ak appka nie je viditeľná
async function testNotification() {
  if (!('Notification' in window)) {
    $q.notify('Tento prehliadač nepodporuje notifikácie')
    return
  }
  if ((await Notification.requestPermission()) !== 'granted') {
    $q.notify('Povoľ notifikácie v nastaveniach prehliadača')
    return
  }
  $q.notify('Prepni sa na inú kartu, o 5 sekúnd príde notifikácia')
  setTimeout(() => {
    // $q.appVisible = Quasar plugin AppVisibility (je appka práve na obrazovke?)
    if ($q.appVisible) {
      $q.notify('Appka je viditeľná, preto sa systémová notifikácia neukázala')
      return
    }
    new Notification('@mara v #general', {
      body: '@dano pošleš mi potom link na repo?',
      icon: '/icons/kanale.svg'
    })
  }, 5000)
}
const colorOptions = [
  { label: 'Levanduľová', value: 'lav' },
  { label: 'Mätová', value: 'mint' },
  { label: 'Ružová', value: 'pink-l' },
  { label: 'Svetlá', value: 'tint' }
]
const fontOptions = [
  { label: 'Figtree', value: 'figtree' },
  { label: 'Systémové písmo', value: 'system' },
  { label: 'Serifové písmo', value: 'serif' }
]
</script>

<style lang="scss">
// napodobenina systémovej notifikácie (ako ju ukáže Windows / Android)
.system-notification {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #2b2738;
  color: #fff;
  border-radius: 12px;
}
.system-notification-icon {
  width: 36px;
  height: 36px;
  flex: none;
}
.system-notification-body {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.system-notification-app {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  opacity: 0.75;
}
.system-notification p {
  margin: 0;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
