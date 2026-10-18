<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <div v-if="!channel && closed" class="empty channel-access">
      <q-icon name="history_toggle_off" size="44px" aria-hidden="true" />
      <h2>Kanál #{{ closed.name }} zanikol</h2>
      <p v-if="closed.reason === 'inactive'">
        Viac ako 30 dní v ňom nepribudla žiadna správa, preto automaticky
        zanikol ({{ closed.date }}). Jeho história už nie je dostupná.
      </p>
      <p v-else>
        Zrušil ho správca @{{ closed.by }} ({{ closed.date }}). Jeho história už
        nie je dostupná.
      </p>
      <p>Názov #{{ closed.name }} je znova voľný, môžeš založiť nový kanál.</p>
      <q-btn
        class="k-btn yellow"
        unelevated
        no-caps
        :label="'Založiť nový #' + closed.name"
        @click="send('/join ' + closed.name)"
      />
      <q-btn
        class="k-btn"
        unelevated
        no-caps
        label="Späť do prehľadu"
        to="/home"
      />
    </div>

    <div v-else-if="!channel" class="empty channel-access">
      <q-icon name="travel_explore" size="44px" aria-hidden="true" />
      <h2>Kanál #{{ $route.params.name }} neexistuje</h2>
      <p>Taký kanál zatiaľ nikto nevytvoril. Môžeš ho založiť ako prvý.</p>
      <q-btn
        class="k-btn yellow"
        unelevated
        no-caps
        :label="'Vytvoriť cez /join ' + $route.params.name"
        @click="send('/join ' + $route.params.name)"
      />
      <q-btn
        class="k-btn"
        unelevated
        no-caps
        label="Späť do prehľadu"
        to="/home"
      />
    </div>

    <div
      v-else-if="channel.banned.includes(state.me)"
      class="empty channel-access"
    >
      <q-icon name="block" size="44px" aria-hidden="true" />
      <h2>Do #{{ channel.name }} nemáš prístup</h2>
      <p
        >V tomto kanáli máš trvalý ban. Prístup ti môže obnoviť správca @{{
          channel.admin
        }}
        pozvaním do kanála.</p
      >
      <q-btn
        class="k-btn"
        unelevated
        no-caps
        label="Späť do prehľadu"
        to="/home"
      />
    </div>

    <div v-else-if="hasChannelInvitation(channel)" class="empty">
      <div class="ticket">
        <q-icon name="mail_outline" size="40px" aria-hidden="true" />
        <p
          >@{{ channelInvitation(channel).from }} ťa pozýva do
          {{ channel.private ? 'súkromného' : 'verejného' }} kanála</p
        >
        <h2>#{{ channel.name }}</h2>
        <p>{{ channel.members.length }} členov</p>
        <p
          >Prijatím pozvánky získaš prístup k správam a môžeš sa zapojiť do
          konverzácie.</p
        >
        <div class="row justify-center q-gutter-sm">
          <q-btn
            class="k-btn dark"
            unelevated
            no-caps
            label="Prijať pozvánku"
            @click="accept"
          />
          <q-btn
            class="k-btn"
            unelevated
            no-caps
            label="Odmietnuť pozvánku"
            @click="decline"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="!channel.members.includes(state.me)"
      class="empty channel-access"
    >
      <q-icon
        :name="channel.private ? 'lock' : 'tag'"
        size="44px"
        aria-hidden="true"
      />
      <h2 v-if="channel.private && channel.admin !== state.me"
        >Tento kanál je súkromný</h2
      >
      <h2 v-else>Pripoj sa do #{{ channel.name }}</h2>
      <p v-if="channel.admin === state.me"
        >Zostávaš správcom tohto kanála. Môžeš sa znova pripojiť.</p
      >
      <p v-else-if="channel.private"
        >Na prístup do #{{ channel.name }} potrebuješ pozvánku od správcu @{{
          channel.admin
        }}.</p
      >
      <p v-else>Po pripojení uvidíš históriu správ a môžeš písať do kanála.</p>
      <q-btn
        v-if="!channel.private || channel.admin === state.me"
        class="k-btn yellow"
        unelevated
        no-caps
        label="Pripojiť sa do kanála"
        @click="send('/join ' + channel.name)"
      />
      <q-btn
        class="k-btn"
        unelevated
        no-caps
        label="Späť do prehľadu"
        to="/home"
      />
    </div>

    <template v-else>
      <header class="sheet-header">
        <h1>
          <q-icon v-if="channel.private" name="lock" size="20px" />
          <span v-else>#</span>
          {{ channel.name }}
        </h1>
        <span class="inline-details">
          <span>{{ channel.private ? 'súkromný' : 'verejný' }}</span>
          <span>správca @{{ channel.admin }}</span>
        </span>
        <q-space />
        <q-toggle
          v-if="channel.admin === state.me"
          :model-value="channel.private"
          label="Súkromný kanál"
          color="positive"
          @update:model-value="updateChannelVisibility($event, channel)"
        />
        <q-btn
          v-if="!channel.private || channel.admin === state.me"
          class="k-btn"
          unelevated
          no-caps
          icon="person_add"
          label="Pozvať"
          :to="'/c/' + channel.name + '/members'"
        />
        <q-btn
          class="k-btn mint"
          unelevated
          no-caps
          :label="showMembers ? 'Skryť členov' : 'Členovia'"
          @click="showMembers = !showMembers"
        />
      </header>

      <StatusBanner />

      <div class="content">
        <MessageList
          :key="channel.name"
          :messages="channel.messages"
          load-older
        />

        <aside v-if="showMembers" class="members">
          <div class="members-heading">
            <h3>Členovia ({{ channelMembers.length }})</h3>
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="close"
              aria-label="Skryť členov"
              @click="showMembers = false"
            />
          </div>
          <div v-for="nick in channelMembers" :key="nick" class="member">
            <UserAvatar :nick="nick" small />
            <b>{{ nick }}</b>
            <span v-if="nick === channel.admin">správca</span>
          </div>
        </aside>
      </div>

      <footer
        class="composer channel-composer"
        @focusin="composerFocused = true"
        @focusout="
          composerFocused = $event.currentTarget.contains($event.relatedTarget)
        "
      >
        <div v-if="channel.typing">
          <button class="chip" @click="showTyping = !showTyping">
            {{ channel.typing.nick }} píše…
          </button>
          <p v-if="showTyping" class="typing-text">{{ channel.typing.text }}</p>
        </div>

        <section
          v-if="showCommands && matchingCommands.length"
          id="command-suggestions"
          class="command-suggestions"
          aria-label="Príkazy"
        >
          <button
            v-for="command in matchingCommands"
            :key="command.name"
            type="button"
            class="command-suggestion"
            @click="completeCommand(command)"
          >
            <code>{{ command.usage }}</code>
            <span>{{ command.description }}</span>
          </button>
        </section>

        <form class="command-line" @submit.prevent="send(input)">
          <span aria-hidden="true"
            ><q-icon
              :name="input.startsWith('/') ? 'terminal' : 'chat_bubble_outline'"
              size="20px"
          /></span>
          <input
            ref="composerInput"
            v-model="input"
            :placeholder="'Napíš správu do #' + channel.name"
            aria-label="Správa alebo príkaz"
            :aria-controls="
              showCommands && matchingCommands.length
                ? 'command-suggestions'
                : undefined
            "
            autocomplete="off"
            @keydown.esc="commandsDismissed = true"
          />
          <button>POSLAŤ</button>
        </form>
      </footer>
    </template>
  </q-page>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  state,
  findChannel,
  addMessage,
  runCommand,
  channelInvitation,
  hasChannelInvitation,
  acceptChannelInvitation,
  declineChannelInvitation
} from '@/stores/chat.js'
import MessageList from '@/components/MessageList.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import StatusBanner from '@/components/StatusBanner.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const confirmChannelExit = inject('confirmChannelExit')
const updateChannelVisibility = inject('updateChannelVisibility')

const channel = computed(() => findChannel(route.params.name))
const channelMembers = computed(() => {
  if (!channel.value) {
    return []
  }
  const members = [channel.value.admin]
  for (const nick of channel.value.members) {
    if (!members.includes(nick)) {
      members.push(nick)
    }
  }
  return members
})
const closed = computed(() =>
  state.closedChannels.find(item => item.name === route.params.name)
)
const input = ref('')
// na mobile (do 700 px) sú členovia predvolene skrytí, otvoria sa tlačidlom
const showMembers = ref($q.screen.width > 700)
const showTyping = ref(false)
const composerInput = ref(null)
const composerFocused = ref(false)
const commandsDismissed = ref(false)

const availableCommands = computed(() => {
  const isAdmin = channel.value?.admin === state.me
  const isPrivate = channel.value?.private
  const commands = [
    {
      name: '/join',
      usage: '/join nazov-kanala [private]',
      description:
        'Pripojí ťa do kanála alebo vytvorí nový. Pridaním private vytvoríš súkromný kanál.',
      arguments: true
    },
    {
      name: '/invite',
      usage: '/invite nick',
      description: 'Pozve používateľa do tohto kanála. Nick píš bez @.',
      arguments: true,
      available: !isPrivate || isAdmin
    },
    {
      name: '/revoke',
      usage: '/revoke nick',
      description:
        'Odoberie používateľovi prístup do tohto kanála. Nick píš bez @.',
      arguments: true,
      available: isAdmin
    },
    {
      name: '/kick',
      usage: '/kick nick',
      description: isAdmin
        ? 'Vyhodí používateľa z kanála a udelí mu trvalý ban. Nick píš bez @.'
        : 'Pridá hlas za vyhodenie používateľa. Na trvalý ban sú potrebné tri hlasy.',
      arguments: true,
      available: !isPrivate
    },
    {
      name: '/list',
      usage: '/list',
      description: 'Zobrazí členov tohto kanála.'
    },
    {
      name: '/cancel',
      usage: '/cancel',
      description: isAdmin
        ? 'Odchodom správcu sa celý kanál zruší aj pre ostatných členov.'
        : 'Opustí tento kanál. Kanál zostane zachovaný.'
    },
    {
      name: '/quit',
      usage: '/quit',
      description: 'Zruší celý kanál aj pre ostatných členov.',
      available: isAdmin
    }
  ]
  return commands
})
const matchingCommands = computed(() => {
  const prefix = input.value.split(/\s/)[0]
  return availableCommands.value.filter(command =>
    command.name.startsWith(prefix)
  )
})
const showCommands = computed(
  () =>
    composerFocused.value &&
    input.value.startsWith('/') &&
    !/\s/.test(input.value) &&
    !commandsDismissed.value
)

watch(
  input,
  () => {
    commandsDismissed.value = false
  },
  { flush: 'sync' }
)
watch(
  () => route.params.name,
  () => {
    input.value = ''
    commandsDismissed.value = false
  }
)

function completeCommand(command) {
  input.value = command.name
  if (command.arguments) {
    input.value += ' '
  }
  commandsDismissed.value = true
  if (composerInput.value) {
    composerInput.value.focus()
  }
}

function send(text) {
  input.value = ''
  if (!text.trim()) {
    return
  }

  if (!text.startsWith('/')) {
    addMessage(channel.value.messages, text)
    return
  }

  const command = text.trim().split(' ')[0]
  if (command === '/cancel' || command === '/quit') {
    confirmChannelExit(command, channel.value)
    return
  }

  const result = runCommand(text, channel.value)
  $q.notify(result.message)
  if (result.goTo) {
    router.push(result.goTo)
  }
  if (text === '/list') {
    showMembers.value = true
  }
}

function accept() {
  const result = acceptChannelInvitation(channel.value)
  $q.notify(result.message)
}

function decline() {
  const result = declineChannelInvitation(channel.value)
  $q.notify(result.message)
  if (result.success) {
    router.push('/home')
  }
}
</script>

<style lang="scss">
.members-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.channel-access {
  padding: 24px;
  text-align: center;
}
.channel-access p {
  max-width: 55ch;
}
.channel-composer {
  position: relative;
}
.command-suggestions {
  position: absolute;
  z-index: 1;
  bottom: calc(100% + 8px);
  left: 14px;
  width: 360px;
  max-width: calc(100% - 28px);
  max-height: min(320px, 45dvh);
  min-width: 0;
  overflow-y: auto;
  background: var(--tint);
  color: var(--ink);
  border: var(--border);
  border-radius: 12px;
}
.command-suggestion {
  display: grid;
  gap: 4px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  text-align: left;
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}
.command-suggestion:hover {
  background: var(--lav);
}
.command-suggestion:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: -3px;
}
.command-suggestion code {
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.command-suggestion span {
  font-size: 13px;
  line-height: 1.4;
}
</style>
