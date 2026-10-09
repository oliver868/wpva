<template>
  <!-- vysvetlenie, čo znamená môj stav DND / Offline (pri Online sa neukazuje) -->
  <div
    v-if="status !== 'online'"
    class="status-banner"
    :class="status"
    role="status"
  >
    <i class="status" :class="status" aria-hidden="true" />
    <p v-if="status === 'dnd'">
      <b>Máš zapnuté Nerušiť.</b> Správy vidíš, ale neprichádzajú ti
      notifikácie.
    </p>
    <p v-else>
      <b>Si offline.</b> Nové správy ti neprichádzajú. Keď sa prepneš na online,
      kanály sa automaticky aktualizujú.
    </p>
    <q-btn
      class="k-btn mint"
      unelevated
      dense
      no-caps
      label="Prepnúť na online"
      @click="goOnline"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { state } from '@/stores/chat.js'

const $q = useQuasar()
const status = computed(() => state.users[state.me].status)

function goOnline() {
  state.users[state.me].status = 'online'
  $q.notify('Si online, kanály sú aktualizované')
}
</script>

<style lang="scss">
.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px;
  background: #fff1b8;
  border-bottom: var(--border);
}
.status-banner.offline {
  background: var(--lav);
}
.status-banner p {
  flex: 1;
  margin: 0;
  font-size: 13px;
}
</style>
