<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <header class="sheet-header">
      <UserAvatar :nick="friend.nick" />
      <h1>{{ friend.nick }}</h1>
      <span class="chip"><q-icon name="alternate_email" size="14px" />{{ thread.title }}</span>
      <span class="chip">
        {{ state.users[friend.nick].name }} · {{ state.users[friend.nick].status }}
      </span>
    </header>

    <MessageList :key="friend.nick + '-' + thread.id" :messages="thread.messages" />

    <footer class="composer">
      <form class="command-line" @submit.prevent="send">
        <span>@</span>
        <input v-model="input" :placeholder="'správa pre ' + friend.nick + ' · ' + thread.title" />
        <button>POSLAŤ</button>
      </form>
    </footer>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { state, addMessage } from '@/stores/chat.js'
import MessageList from '@/components/MessageList.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const friend = computed(() => state.friends.find(f => f.nick === route.params.nick))
const thread = computed(
  () => friend.value?.threads.find(t => t.id === route.params.threadId) || friend.value?.threads[0],
)
const input = ref('')

function send() {
  if (input.value.trim()) addMessage(thread.value.messages, input.value)
  input.value = ''
}
</script>
