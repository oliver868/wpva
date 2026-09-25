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
        <q-input v-model="state.profile.firstName" class="k-input" borderless dense />
        <label>Priezvisko</label>
        <q-input v-model="state.profile.lastName" class="k-input" borderless dense />
        <label>Email</label>
        <q-input v-model="state.profile.email" class="k-input" borderless dense type="email" />
        <p class="hint">NickName @{{ state.me }} je unikátny a nedá sa zmeniť.</p>
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
        <q-toggle v-model="state.notifications" color="positive" label="Notifikácie o nových správach" />
        <q-toggle v-model="state.onlyMentions" color="positive" :label="'Iba správy pre mňa (@' + state.me + ')'" />
        <p class="hint">Notifikácia príde, iba keď appka nie je viditeľná.</p>
      </section>

      <section class="panel">
        <h3 class="lav">Účet</h3>
        <p>Prihlásený ako <b>{{ state.profile.email }}</b></p>
        <q-btn class="k-btn danger" unelevated no-caps icon="logout" label="Odhlásiť sa" to="/login" />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { state } from '@/stores/chat.js'
</script>
