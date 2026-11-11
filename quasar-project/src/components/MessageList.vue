<template>
  <div ref="box" class="messages scroll" @scroll="checkTop">
    <div v-if="loading" class="history-loading" role="status">
      <q-spinner-dots size="26px" />
      Načítavam staršie správy…
    </div>
    <div v-else-if="loadError" class="history-end" role="alert">
      <span>{{ loadError }}</span>
      <q-btn flat no-caps label="Skúsiť znova" @click="loadMore" />
    </div>

    <!-- koniec histórie: staršie správy už nie sú -->
    <p v-if="loadOlder && historyEnd" class="history-end">
      <q-icon name="history" size="16px" aria-hidden="true" />
      Toto je začiatok histórie, staršie správy už nie sú.
    </p>

    <div
      v-for="(message, index) in visibleMessages"
      :key="message.id ?? firstVisibleIndex + index"
      class="message"
      :class="{
        mine: message.from === state.me,
        mentioned: message.from !== state.me && mentionsMe(message.text)
      }"
    >
      <div
        class="message-head"
        :style="{
          background:
            'var(--' + (state.users[message.from]?.color ?? 'lav') + ')'
        }"
      >
        <b>{{ message.from === state.me ? 'ty' : message.from }}</b>
        <span>{{ message.time }}</span>
      </div>
      <p>{{ message.text }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { state, mentionsUser } from '@/stores/chat.js'

const props = defineProps({
  messages: { type: Array, required: true },
  loadOlder: { type: Boolean, default: false },
  // Vráti, či sú ďalšie správy. Pri chybe vyhodí výnimku.
  fetchOlder: { type: Function, default: null }
})

const box = ref(null)
const loading = ref(false)
const loadError = ref('')
const pageSize = 20
const firstVisibleIndex = ref(0)
if (!props.fetchOlder && props.loadOlder && props.messages.length > pageSize) {
  firstVisibleIndex.value = props.messages.length - pageSize
}
const visibleMessages = computed(() =>
  props.messages.slice(firstVisibleIndex.value)
)
const olderOnServer = ref(true)
// všetky správy sú už zobrazené = začiatok histórie
const historyEnd = computed(() =>
  props.fetchOlder ? !olderOnServer.value : firstVisibleIndex.value === 0
)

// správa je adresovaná mne, ak obsahuje @môjnick ako samostatné slovo
// (@dan nezvýrazní správu pre @dano)
function mentionsMe(text) {
  return mentionsUser(text)
}

async function loadMore() {
  if (!props.loadOlder || historyEnd.value || loading.value) return
  const countBefore = visibleMessages.value.length
  loading.value = true
  loadError.value = ''
  try {
    if (props.fetchOlder) olderOnServer.value = await props.fetchOlder()
    else
      firstVisibleIndex.value = Math.max(0, firstVisibleIndex.value - pageSize)
  } catch {
    loadError.value = 'Staršie správy sa nepodarilo načítať.'
  } finally {
    loading.value = false
  }
  await nextTick()
  if (visibleMessages.value.length > countBefore) checkTop()
}

// Pri hornom okraji načítaj ďalšiu stranu histórie.
function checkTop() {
  if (
    box.value &&
    props.loadOlder &&
    !loading.value &&
    !loadError.value &&
    !historyEnd.value &&
    box.value.scrollTop <= 100
  ) {
    loadMore()
  }
}

function scrollDown() {
  if (box.value) box.value.scrollTop = box.value.scrollHeight
}

onMounted(async () => {
  scrollDown()
  await nextTick()
  checkTop()
})

watch(
  () => [firstVisibleIndex.value, props.messages.length, props.messages.at(-1)],
  ([, , last], [, previousLength, previousLast]) => {
    const element = box.value
    if (!element) return
    const nearBottom =
      element.scrollHeight - element.clientHeight - element.scrollTop < 80
    const newLast = last !== previousLast
    const follow =
      previousLength === 0 ||
      (newLast && (nearBottom || last?.from === state.me))
    const top = element.getBoundingClientRect().top
    const anchor = [...element.querySelectorAll('.message')].find(
      message => message.getBoundingClientRect().bottom > top
    )
    const anchorTop = anchor?.getBoundingClientRect().top

    nextTick(() => {
      if (box.value !== element) return
      if (follow) scrollDown()
      else if (anchor?.isConnected) {
        element.scrollTop += anchor.getBoundingClientRect().top - anchorTop
      }
      checkTop()
    })
  }
)
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
