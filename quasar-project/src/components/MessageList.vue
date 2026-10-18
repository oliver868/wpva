<template>
  <div ref="box" class="messages scroll" @scroll="checkTop">
    <q-infinite-scroll
      ref="scroller"
      reverse
      :offset="100"
      :disable="!loadOlder || historyEnd"
      @load="onLoad"
    >
      <!-- zobrazí sa počas načítavania staršej histórie -->
      <template #loading>
        <div class="history-loading" role="status">
          <q-spinner-dots size="26px" />
          Načítavam staršie správy…
        </div>
      </template>

      <!-- koniec histórie: staršie správy už nie sú -->
      <p v-if="loadOlder && historyEnd" class="history-end">
        <q-icon name="history" size="16px" aria-hidden="true" />
        Toto je začiatok histórie, staršie správy už nie sú.
      </p>

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
const scroller = ref(null)
const pageSize = 20
const firstVisibleIndex = ref(0)
if (props.loadOlder && props.messages.length > pageSize) {
  firstVisibleIndex.value = props.messages.length - pageSize
}
const visibleMessages = computed(() =>
  props.messages.slice(firstVisibleIndex.value)
)
// všetky správy sú už zobrazené = začiatok histórie
const historyEnd = computed(() => firstVisibleIndex.value === 0)

function onLoad(_index, done) {
  // krátke čakanie simuluje odpoveď servera, aby bolo vidno indikátor
  // (v 2. fáze sa nahradí volaním API)
  setTimeout(() => {
    if (!box.value) return // medzitým si odišiel z chatu
    firstVisibleIndex.value -= pageSize
    if (firstVisibleIndex.value < 0) {
      firstVisibleIndex.value = 0
    }
    nextTick(() => {
      done(historyEnd.value)
      setTimeout(checkTop, 50) // pri malom počte správ hneď ďalšia strana
    })
  }, 700)
}

// keď je vrch zoznamu blízko, načítaj staršie správy
// (poistka ku q-infinite-scroll, ktorý sa v chate nie vždy sám ozve)
function checkTop() {
  if (
    box.value &&
    props.loadOlder &&
    !historyEnd.value &&
    box.value.scrollTop <= 100
  ) {
    scroller.value?.trigger()
  }
}

function scrollDown() {
  nextTick(() => {
    if (box.value) box.value.scrollTop = box.value.scrollHeight
  })
}

onMounted(scrollDown)

watch(() => props.messages[props.messages.length - 1], scrollDown)
</script>

<style lang="scss">
.history-loading,
.history-end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.history-end {
  padding: 6px 0;
}
</style>
