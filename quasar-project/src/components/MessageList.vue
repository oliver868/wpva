<template>
  <div ref="box" class="messages scroll">
    <q-infinite-scroll reverse :disable="!loadOlder" @load="onLoad">
      <div
        v-for="(message, index) in visibleMessages"
        :key="firstVisibleIndex + index"
        class="message"
        :class="{
          mine: message.from === state.me,
          mentioned: message.text.includes('@' + state.me)
        }"
      >
        <div
          class="message-head"
          :style="{
            background: 'var(--' + state.users[message.from].color + ')'
          }"
        >
          <b>{{ message.from === state.me ? 'ty' : message.from }}</b>
          <span>{{ message.time }}</span>
        </div>
        <p>{{ message.text }}</p>
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { state } from '@/stores/chat.js'

const props = defineProps({
  messages: { type: Array, required: true },
  loadOlder: { type: Boolean, default: false }
})

const box = ref(null)
const pageSize = 20
const firstVisibleIndex = ref(0)
if (props.loadOlder && props.messages.length > pageSize) {
  firstVisibleIndex.value = props.messages.length - pageSize
}
const visibleMessages = computed(() =>
  props.messages.slice(firstVisibleIndex.value)
)

function onLoad(_index, done) {
  firstVisibleIndex.value -= pageSize
  if (firstVisibleIndex.value < 0) {
    firstVisibleIndex.value = 0
  }
  nextTick(() => {
    const allMessagesVisible = firstVisibleIndex.value === 0
    done(allMessagesVisible)
  })
}

function scrollDown() {
  nextTick(() => {
    box.value.scrollTop = box.value.scrollHeight
  })
}

onMounted(scrollDown)

watch(() => props.messages[props.messages.length - 1], scrollDown)
</script>
