<template>
  <!-- trieda "scroll" = tu sa scrolluje, q-infinite-scroll to použije -->
  <div ref="box" class="messages scroll">
    <!-- reverse: staršie správy sa načítajú, keď scrollneš hore -->
    <q-infinite-scroll reverse :disable="!loadOlder" @load="onLoad">
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="message"
        :class="{
          mine: m.from === state.me,
          mentioned: m.text.includes('@' + state.me)
        }"
      >
        <div
          class="message-head"
          :style="{ background: 'var(--' + state.users[m.from].color + ')' }"
        >
          <b>{{ m.from === state.me ? 'ty' : m.from }}</b>
          <span>{{ m.time }}</span>
        </div>
        <p>{{ m.text }}</p>
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { state, addOlderMessages } from '@/stores/chat.js'

const props = defineProps({
  messages: { type: Array, required: true },
  loadOlder: { type: Boolean, default: false } // povoliť infinite scroll
})

const box = ref(null)

function onLoad(index, done) {
  addOlderMessages(props.messages)
  done(index >= 3) // po 3 načítaniach už staršie správy nie sú
}

function scrollDown() {
  nextTick(() => (box.value.scrollTop = box.value.scrollHeight))
}

onMounted(scrollDown)
// keď pribudne nová správa na koniec, posuň sa dole
watch(() => props.messages[props.messages.length - 1], scrollDown)
</script>
