<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <header class="sheet-header">
      <UserAvatar :nick="friend.nick" />
      <h1>{{ friend.nick }}</h1>
      <span class="chip">
        {{ state.users[friend.nick].name }} · {{ state.users[friend.nick].status }}
      </span>
    </header>

    <MessageList :key="friend.nick" :messages="friend.messages" />

    <footer class="composer">
      <form class="command-line" @submit.prevent="send">
        <span>@</span>
        <input v-model="input" :placeholder="'správa pre ' + friend.nick" />
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
const input = ref('')

function send() {
  if (input.value.trim()) addMessage(friend.value.messages, input.value)
  input.value = ''
}
</script>
