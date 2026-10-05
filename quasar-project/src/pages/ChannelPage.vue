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

    <!-- 2. mám pozvánku -->
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

    <!-- 3. nie som členom -->
    <div
      v-else-if="!channel.members.includes(state.me)"
      class="empty channel-access"
    >
      <q-icon
        :name="channel.private ? 'lock' : 'tag'"
        size="44px"
        aria-hidden="true"
      />
      <h2 v-if="channel.private">Tento kanál je súkromný</h2>
      <h2 v-else>Pripoj sa do #{{ channel.name }}</h2>
      <p v-if="channel.private"
        >Na prístup do #{{ channel.name }} potrebuješ pozvánku od správcu @{{
          channel.admin
        }}.</p
      >
      <p v-else>Po pripojení uvidíš históriu správ a môžeš písať do kanála.</p>
      <q-btn
        v-if="!channel.private"
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

    <!-- 4. chat kanála -->
    <template v-else>
      <header class="sheet-header">
        <h1>
          <q-icon v-if="channel.private" name="lock" size="20px" />
          <span v-else>#</span>
          {{ channel.name }}
        </h1>
        <span class="chip">
          {{ channel.private ? 'súkromný' : 'verejný' }} · správca @{{
            channel.admin
          }}
        </span>
        <q-space />
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
        <!-- kto práve píše; po kliknutí vidno rozpísaný text -->
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
                  <div
                    ><dt><code>/join nazov-kanala</code></dt
                    ><dd
                      >Pripojí ťa do verejného kanála. Ak neexistuje, vytvorí
                      ho.</dd
                    ></div
                  >
                  <div
                    ><dt><code>/join nazov-kanala private</code></dt
                    ><dd>Vytvorí nový súkromný kanál.</dd></div
                  >
                  <div v-if="!channel.private || channel.admin === state.me"
                    ><dt><code>/invite nick</code></dt
                    ><dd>Pozve používateľa. Nick píš bez @.</dd></div
                  >
                  <div v-if="channel.private && channel.admin === state.me"
                    ><dt><code>/revoke nick</code></dt
                    ><dd
                      >Odoberie používateľovi prístup do súkromného kanála.</dd
                    ></div
                  >
                  <div v-if="!channel.private"
                    ><dt><code>/kick nick</code></dt
                    ><dd>{{
                      channel.admin === state.me
                        ? 'Vyhodí používateľa natrvalo.'
                        : 'Pridá hlas za vyhodenie používateľa. Na trvalý ban sú potrebné tri hlasy.'
                    }}</dd></div
                  >
                  <div
                    ><dt><code>/list</code></dt
                    ><dd>Zobrazí členov tohto kanála.</dd></div
                  >
                  <div
                    ><dt><code>/cancel</code></dt
                    ><dd>{{
                      channel.admin === state.me
                        ? 'Opustí a zruší celý kanál, pretože si jeho správca.'
                        : 'Opustí tento kanál.'
                    }}</dd></div
                  >
                  <div v-if="channel.admin === state.me"
                    ><dt><code>/quit</code></dt
                    ><dd>Zruší celý kanál aj pre ostatných členov.</dd></div
                  >
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

        <form class="command-line" @submit.prevent="send(input)">
          <span aria-hidden="true"
            ><q-icon
              :name="input.startsWith('/') ? 'terminal' : 'chat_bubble_outline'"
              size="20px"
          /></span>
          <input
            v-model="input"
            :placeholder="'Napíš správu do #' + channel.name"
            aria-label="Správa alebo príkaz"
          />
          <button>POSLAŤ</button>
        </form>
      </footer>
    </template>
  </q-page>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, findChannel, addMessage, runCommand } from '@/stores/chat.js'
import MessageList from '@/components/MessageList.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const confirmChannelExit = inject('confirmChannelExit')

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
  state.channels.splice(state.channels.indexOf(channel.value), 1)
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
</style>
