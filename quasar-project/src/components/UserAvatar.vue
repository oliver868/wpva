<template>
  <!-- kruh s iniciálami a bodkou stavu (online / dnd / offline) -->
  <span
    class="avatar"
    :class="{ small }"
    :style="{ background: 'var(--' + (state.users[nick]?.color ?? 'lav') + ')' }"
  >
    {{ nick.slice(0, 2).toUpperCase() }}
    <i v-if="state.users[nick]" class="status" :class="state.users[nick].status" />
  </span>
</template>

<script setup>
import { state } from '@/stores/chat.js'

defineProps({
  nick: { type: String, required: true },
  small: { type: Boolean, default: false }
})
</script>
