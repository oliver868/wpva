<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <!-- 1. kanál neexistuje -->
    <div v-if="!channel" class="empty">
      <h2>#{{ $route.params.name }} neexistuje</h2>
      <q-btn
        class="k-btn yellow"
        unelevated
        no-caps
        :label="'Vytvoriť cez /join ' + $route.params.name"
        @click="send('/join ' + $route.params.name)"
      />
    </div>

    <!-- 2. mám pozvánku -->
    <div v-else-if="channel.invite" class="empty">
      <div class="ticket">
        <p>@{{ channel.admin }} ťa pozýva do súkromného kanála</p>
        <h2>#{{ channel.name }}</h2>
        <p>{{ channel.members.length }} členov</p>
        <div class="row justify-center q-gutter-sm">
          <q-btn class="k-btn dark" unelevated no-caps label="Prijať" @click="accept" />
          <q-btn class="k-btn" unelevated no-caps label="Odmietnuť" @click="decline" />
        </div>
      </div>
    </div>

    <!-- 3. nie som členom -->
    <div v-else-if="!channel.members.includes(state.me)" class="empty">
      <h2>V #{{ channel.name }} nie si členom</h2>
      <q-btn
        class="k-btn yellow"
        unelevated
        no-caps
        :label="'/join ' + channel.name"
        @click="send('/join ' + channel.name)"
      />
    </div>

    <!-- 4. chat kanála -->
    <template v-else>
      <header class="sheet-header">
        <h1>
          <q-icon v-if="channel.private" name="lock" size="20px" />
          <span v-else>#</span>
          {{ channel.name }}
        </h1>
        <span class="chip">
          {{ channel.private ? 'súkromný' : 'verejný' }} · správca @{{ channel.admin }}
        </span>
        <q-space />
        <q-btn
          class="k-btn mint"
          unelevated
          no-caps
          :label="showMembers ? 'Skryť členov' : 'Členovia'"
          @click="showMembers = !showMembers"
        />
      </header>

      <div class="content">
        <MessageList :key="channel.name" :messages="channel.messages" load-older />

        <aside v-if="showMembers" class="members">
          <h3>Členovia ({{ channel.members.length }})</h3>
          <div v-for="nick in channel.members" :key="nick" class="member">
            <UserAvatar :nick="nick" small />
            <b>{{ nick }}</b>
            <span v-if="nick === channel.admin" class="chip">správca</span>
          </div>
        </aside>
      </div>

      <footer class="composer">
        <!-- kto práve píše; po kliknutí vidno rozpísaný text -->
        <div v-if="channel.typing">
          <button class="chip" @click="showTyping = !showTyping">
            {{ channel.typing.nick }} píše…
          </button>
          <p v-if="showTyping" class="typing-text">{{ channel.typing.text }}</p>
        </div>

        <form class="command-line" @submit.prevent="send(input)">
          <span>/</span>
          <input v-model="input" placeholder="správa alebo príkaz: /join /invite /revoke /kick /cancel /quit /list" />
          <button>POSLAŤ</button>
        </form>
      </footer>
    </template>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, findChannel, addMessage, runCommand } from '@/stores/chat.js'
import MessageList from '@/components/MessageList.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const channel = computed(() => findChannel(route.params.name))
const input = ref('')
const showMembers = ref(false)
const showTyping = ref(false)

// odoslanie z príkazového riadku: obyčajná správa alebo príkaz začínajúci "/"
function send(text) {
  input.value = ''
  if (!text.trim()) return

  if (!text.startsWith('/')) {
    addMessage(channel.value.messages, text)
    return
  }

  const result = runCommand(text, channel.value)
  $q.notify(result.message)
  if (result.goTo) router.push(result.goTo)
  if (text === '/list') showMembers.value = true
}

function accept() {
  channel.value.invite = false
  channel.value.members.push(state.me)
}

function decline() {
  state.channels.splice(state.channels.indexOf(channel.value), 1)
  router.push('/')
}
</script>
