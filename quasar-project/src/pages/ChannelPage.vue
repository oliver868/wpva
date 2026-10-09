<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <!-- kanál zanikol (zrušil ho správca alebo 30 dní bez správy) -->
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

    <!-- kanál nikdy neexistoval -->
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

    <div v-else-if="channel.invite" class="empty">
      <div class="ticket">
        <q-icon name="mail_outline" size="40px" aria-hidden="true" />
        <p
          >@{{ channel.admin }} ťa pozýva do
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
        <span class="chip inline-details">
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
          <h3>Členovia ({{ channel.members.length }})</h3>
          <div v-for="nick in channel.members" :key="nick" class="member">
            <UserAvatar :nick="nick" small />
            <b>{{ nick }}</b>
            <span v-if="nick === channel.admin" class="chip">správca</span>
          </div>
        </aside>
      </div>

      <footer class="composer">
        <div class="composer-tools">
          <div v-if="channel.typing">
            <button class="chip" @click="showTyping = !showTyping">
              {{ channel.typing.nick }} píše…
            </button>
            <p v-if="showTyping" class="typing-text">{{
              channel.typing.text
            }}</p>
          </div>
          <q-btn
            flat
            dense
            no-caps
            icon="help_outline"
            label="Príkazy"
            class="command-help-trigger"
          >
            <q-menu anchor="top right" self="bottom right" :offset="[0, 8]">
              <section
                class="command-help"
                aria-labelledby="command-help-title"
              >
                <h2 id="command-help-title">Ako písať do chatu</h2>
                <p
                  >Správu napíš bežne. Príkaz začína znakom / a odošleš ho
                  rovnako ako správu.</p
                >
                <dl>
                  <div v-for="command in availableCommands" :key="command.name">
                    <dt
                      ><code>{{ command.usage }}</code></dt
                    >
                    <dd>{{ command.description }}</dd>
                  </div>
                  <div
                    ><dt><code>@nick text správy</code></dt
                    ><dd
                      >Adresuje správu používateľovi a zvýrazní mu ju.</dd
                    ></div
                  >
                </dl>
                <p class="hint"
                  >Napríklad: <code>/join studovna</code> alebo
                  <code>@mara Ahoj!</code></p
                >
              </section>
            </q-menu>
          </q-btn>
        </div>

        <section
          v-if="showCommands"
          class="command-suggestions"
          aria-label="Nápoveda príkazov"
        >
          <div class="command-suggestions-heading">
            <b>Dostupné príkazy</b>
            <span id="command-suggestions-hint" class="inline-details">
              <span>↑ ↓ výber</span>
              <span>Tab doplní</span>
              <span>Esc zavrie</span>
            </span>
          </div>
          <div
            v-if="matchingCommands.length"
            id="command-suggestions"
            role="listbox"
            aria-label="Dostupné príkazy"
            class="command-suggestions-list"
          >
            <button
              v-for="(command, index) in matchingCommands"
              :id="'command-option-' + index"
              :key="command.name"
              type="button"
              role="option"
              tabindex="-1"
              :aria-selected="activeCommand === index"
              :class="[
                'command-suggestion',
                { 'is-active': activeCommand === index }
              ]"
              @pointerdown.prevent
              @click="completeCommand(command)"
            >
              <code>{{ command.usage }}</code>
              <span>{{ command.description }}</span>
            </button>
          </div>
          <p v-else role="status" class="command-suggestions-empty"
            >Tento príkaz nepoznáme. Napíš / a vyber si zo zoznamu.</p
          >
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
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            :aria-expanded="showCommands && matchingCommands.length > 0"
            :aria-controls="
              showCommands && matchingCommands.length
                ? 'command-suggestions'
                : undefined
            "
            :aria-activedescendant="
              showCommands && matchingCommands.length
                ? 'command-option-' + activeCommand
                : undefined
            "
            :aria-describedby="
              showCommands ? 'command-suggestions-hint' : undefined
            "
            autocomplete="off"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            @keydown="handleCommandKey"
          />
          <button>POSLAŤ</button>
        </form>
      </footer>
    </template>
  </q-page>
</template>

<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, findChannel, addMessage, runCommand } from '@/stores/chat.js'
import MessageList from '@/components/MessageList.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import StatusBanner from '@/components/StatusBanner.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const confirmChannelExit = inject('confirmChannelExit')
const updateChannelVisibility = inject('updateChannelVisibility')

const channel = computed(() => findChannel(route.params.name))
const closed = computed(() =>
  state.closedChannels.find(item => item.name === route.params.name)
)
const input = ref('')
const showMembers = ref(false)
const showTyping = ref(false)
const composerInput = ref(null)
const inputFocused = ref(false)
const commandsDismissed = ref(false)
const activeCommand = ref(0)

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
  return commands.filter(command => command.available !== false)
})
const matchingCommands = computed(() => {
  const prefix = input.value.split(/\s/)[0]
  return availableCommands.value.filter(command =>
    command.name.startsWith(prefix)
  )
})
const showCommands = computed(
  () =>
    inputFocused.value &&
    input.value.startsWith('/') &&
    !commandsDismissed.value
)

watch(
  input,
  () => {
    commandsDismissed.value = false
    activeCommand.value = 0
  },
  { flush: 'sync' }
)
watch(
  () => route.params.name,
  () => {
    input.value = ''
    commandsDismissed.value = false
    activeCommand.value = 0
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

function handleCommandKey(event) {
  if (!showCommands.value || event.isComposing) {
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    commandsDismissed.value = true
    return
  }
  const commandCount = matchingCommands.value.length
  if (commandCount === 0) {
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (event.key === 'ArrowDown') {
      activeCommand.value += 1
    } else {
      activeCommand.value -= 1
    }
    if (activeCommand.value >= commandCount) {
      activeCommand.value = 0
    } else if (activeCommand.value < 0) {
      activeCommand.value = commandCount - 1
    }

    nextTick(() => {
      const optionId = 'command-option-' + activeCommand.value
      const option = document.getElementById(optionId)
      if (option) {
        option.scrollIntoView({ block: 'nearest' })
      }
    })
    return
  }

  const pressedTab = event.key === 'Tab' && !event.shiftKey
  const pressedEnter = event.key === 'Enter'
  const hasArguments = /\s/.test(input.value)

  if ((pressedTab || pressedEnter) && !hasArguments) {
    const command = matchingCommands.value[activeCommand.value]
    if (pressedEnter && input.value === command.name) {
      return
    }
    event.preventDefault()
    completeCommand(command)
  }
}

function send(text) {
  input.value = ''
  if (!text.trim()) return

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
  if (result.goTo) router.push(result.goTo)
  if (text === '/list') showMembers.value = true
}

function accept() {
  channel.value.invite = false
  channel.value.members.push(state.me)
}

function decline() {
  channel.value.invite = false
  router.push('/')
}
</script>

<style lang="scss">
.channel-access {
  padding: 24px;
  text-align: center;
}
.channel-access p {
  max-width: 55ch;
}
.composer-tools {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.command-help-trigger {
  margin-left: auto;
  flex: none;
}
.command-help {
  width: 420px;
  max-width: calc(100vw - 32px);
  max-height: 65vh;
  overflow-y: auto;
  padding: 20px;
  background: var(--tint);
  color: var(--ink);
}
.command-help h2 {
  font-size: 18px;
}
.command-help p {
  margin: 12px 0;
}
.command-help dl {
  margin: 0;
}
.command-help dl > div {
  padding: 12px 0;
  border-top: 1px solid var(--lav);
}
.command-help dt {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.command-help dd {
  margin: 4px 0 0;
}
.command-help code {
  font-size: 13px;
}
.command-suggestions {
  min-width: 0;
  overflow: hidden;
  background: var(--tint);
  color: var(--ink);
  border: var(--border);
  border-radius: 12px;
}
.command-suggestions-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ink);
}
.command-suggestions-heading span {
  font-size: 12px;
}
.command-suggestions-list {
  max-height: min(320px, 32dvh);
  overflow-y: auto;
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
.command-suggestion + .command-suggestion {
  border-top: 1px solid var(--lav);
}
.command-suggestion:hover,
.command-suggestion.is-active {
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
.command-suggestion span,
.command-suggestions-empty {
  font-size: 13px;
}
.command-suggestions-empty {
  margin: 0;
  padding: 12px;
}
</style>
