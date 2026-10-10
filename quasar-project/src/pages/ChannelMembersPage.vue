<template>
  <q-page class="sheet" :style-fn="() => ({})">
    <header class="sheet-header">
      <h1>Správa členov</h1>
      <span v-if="channel" class="chip">#{{ channel.name }}</span>
      <q-space />
      <q-btn
        class="k-btn"
        unelevated
        no-caps
        icon="arrow_back"
        label="Späť do chatu"
        :to="'/c/' + route.params.name"
      />
    </header>

    <div v-if="!isMember" class="empty">
      <q-icon name="lock" size="40px" aria-hidden="true" />
      <h2>Zoznam členov nie je dostupný</h2>
      <p>Členov môžeš spravovať v kanáli, ktorého si členom.</p>
    </div>
    <div v-else class="channel-members-content">
      <section class="channel-invite" aria-labelledby="invite-title">
        <h2 id="invite-title">Pozvať používateľa</h2>
        <p v-if="!canInvite"
          >Do súkromného kanála môže pozývať iba správca @{{
            channel.admin
          }}.</p
        >
        <template v-else>
          <p>{{
            channel.private
              ? 'Do súkromného kanála má prístup iba jeho člen.'
              : 'Do verejného kanála môže používateľa pozvať každý člen.'
          }}</p>
          <p>Používateľ sa stane členom až po prijatí pozvánky.</p>
          <q-form class="channel-invite-form" @submit="invite">
            <q-select
              v-model="selectedNick"
              class="k-input"
              borderless
              label="Používateľ"
              :options="inviteOptions"
              emit-value
              map-options
              :disable="!inviteOptions.length"
            />
            <q-btn
              class="k-btn yellow"
              unelevated
              no-caps
              icon="person_add"
              label="Pozvať"
              type="submit"
              :disable="!selectedNick"
            />
          </q-form>
          <p v-if="!inviteOptions.length" class="hint"
            >Všetci dostupní používatelia sú už členmi alebo majú pozvánku.</p
          >
        </template>
      </section>

      <section
        v-if="channel.invitations && channel.invitations.length"
        class="channel-member-section"
        aria-labelledby="pending-title"
      >
        <h2 id="pending-title"
          >Čakajúce pozvánky ({{ channel.invitations.length }})</h2
        >
        <ul class="channel-member-list">
          <li
            v-for="invitation in channel.invitations"
            :key="invitation.nick"
            class="channel-member-row"
          >
            <UserAvatar :nick="invitation.nick" />
            <div class="channel-member-info">
              <b>@{{ invitation.nick }}</b>
              <small>Čaká na prijatie pozvánky</small>
            </div>
          </li>
        </ul>
      </section>

      <section class="channel-member-section" aria-labelledby="member-title">
        <h2 id="member-title">Členovia ({{ channel.members.length }})</h2>
        <p v-if="channel.private" class="hint"
          >Správca môže odobrať prístup členovi.</p
        >
        <p v-else-if="isAdmin" class="hint"
          >Ako správca môžeš používateľa vyhodiť natrvalo.</p
        >
        <p v-else class="hint"
          >Trvalé vyhodenie nastane po troch hlasoch členov alebo rozhodnutí
          správcu.</p
        >
        <ul class="channel-member-list">
          <li
            v-for="nick in channel.members"
            :key="nick"
            class="channel-member-row"
          >
            <UserAvatar v-if="state.users[nick]" :nick="nick" />
            <span v-else class="avatar">{{
              nick.slice(0, 2).toUpperCase()
            }}</span>
            <div class="channel-member-info">
              <b
                >@{{ nick }}
                <span v-if="nick === state.me" class="chip">ty</span></b
              >
              <small>
                <span class="inline-details">
                  <span>{{ state.users[nick]?.name || nick }}</span>
                  <span>{{ statusLabel(state.users[nick]?.status) }}</span>
                </span>
              </small>
            </div>
            <span v-if="nick === channel.admin" class="chip">správca</span>
            <q-btn
              v-else-if="nick !== state.me && (isAdmin || !channel.private)"
              class="k-btn"
              unelevated
              no-caps
              :label="memberAction.label"
              :aria-label="memberAction.label + ' používateľa @' + nick"
              @click="pendingNick = nick"
            />
          </li>
        </ul>
      </section>

      <section
        v-if="isAdmin && channel.banned.length"
        class="channel-member-section"
        aria-labelledby="banned-title"
      >
        <h2 id="banned-title">Zablokovaní používatelia</h2>
        <p class="hint"
          >Obnovením prístupu sa odošle pozvánka. Členom sa používateľ stane po
          jej prijatí.</p
        >
        <ul class="channel-member-list">
          <li
            v-for="nick in channel.banned"
            :key="nick"
            class="channel-member-row"
          >
            <div class="channel-member-info"
              ><b>@{{ nick }}</b></div
            >
            <q-btn
              class="k-btn mint"
              unelevated
              no-caps
              label="Obnoviť prístup"
              @click="run('/invite ' + nick)"
            />
          </li>
        </ul>
      </section>
    </div>

    <q-dialog
      :model-value="!!pendingNick"
      @update:model-value="pendingNick = ''"
    >
      <div class="dialog">
        <h2>{{ memberAction.title }}</h2>
        <p v-if="channel?.private"
          >@{{ pendingNick }} stratí prístup do súkromného kanála.</p
        >
        <p v-else-if="isAdmin"
          >@{{ pendingNick }} dostane trvalý ban v tomto kanáli.</p
        >
        <p v-else
          >Pridáš hlas za vyhodenie @{{ pendingNick }}. Na trvalý ban sú
          potrebné tri hlasy.</p
        >
        <div class="row justify-end q-gutter-sm">
          <q-btn
            class="k-btn"
            unelevated
            no-caps
            label="Zrušiť"
            @click="pendingNick = ''"
          />
          <q-btn
            class="k-btn dark"
            unelevated
            no-caps
            :label="memberAction.confirmLabel"
            @click="removeMember"
          />
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import {
  state,
  findChannel,
  runCommand,
  hasChannelInvitation
} from '@/stores/chat.js'
import UserAvatar from '@/components/UserAvatar.vue'

const route = useRoute()
const $q = useQuasar()
const selectedNick = ref(null)
const pendingNick = ref('')
watch(
  () => route.params.name,
  () => {
    selectedNick.value = null
    pendingNick.value = ''
  }
)
const channel = computed(() => findChannel(route.params.name))
const isMember = computed(() => {
  if (!channel.value) {
    return false
  }
  if (channel.value.banned.includes(state.me)) {
    return false
  }
  if (hasChannelInvitation(channel.value)) {
    return false
  }
  return channel.value.members.includes(state.me)
})
const isAdmin = computed(() => channel.value?.admin === state.me)
const canInvite = computed(
  () => isMember.value && (!channel.value.private || isAdmin.value)
)
const inviteOptions = computed(() => {
  const options = []
  for (const nick of Object.keys(state.users)) {
    if (channel.value) {
      if (channel.value.members.includes(nick)) {
        continue
      }
      if (channel.value.banned.includes(nick)) {
        continue
      }
    }
    if (hasChannelInvitation(channel.value, nick)) {
      continue
    }

    options.push({
      label: '@' + nick + ' ' + state.users[nick].name,
      value: nick
    })
  }
  return options
})

const memberAction = computed(() => {
  if (channel.value?.private) {
    return {
      label: 'Odobrať',
      title: 'Odobrať člena?',
      confirmLabel: 'Odobrať'
    }
  }
  if (isAdmin.value) {
    return {
      label: 'Vyhodiť',
      title: 'Vyhodiť člena?',
      confirmLabel: 'Vyhodiť'
    }
  }
  return {
    label: 'Hlasovať za vyhodenie',
    title: 'Hlasovať za vyhodenie?',
    confirmLabel: 'Hlasovať'
  }
})

function run(command) {
  if (!isMember.value) return
  const result = runCommand(command, channel.value)
  $q.notify(result.message)
}

function invite() {
  if (!selectedNick.value || !canInvite.value) return
  run('/invite ' + selectedNick.value)
  selectedNick.value = null
}

function removeMember() {
  let command = '/kick'
  if (channel.value.private) {
    command = '/revoke'
  }
  run(command + ' ' + pendingNick.value)
  pendingNick.value = ''
}

function statusLabel(status) {
  if (status === 'online') return 'Online'
  if (status === 'dnd') return 'Nerušiť'
  if (status === 'offline') return 'Offline'
  return 'Stav nie je dostupný'
}
</script>

<style scoped lang="scss">
.channel-members-content {
  overflow-y: auto;
  padding: 24px;
}
.channel-members-content h2 {
  font-size: 18px;
}
.channel-invite {
  padding-bottom: 24px;
  border-bottom: var(--border);
}
.channel-invite p {
  max-width: 65ch;
}
.channel-invite-form {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 620px;
  margin-bottom: 12px;
}
.channel-invite-form .q-select {
  flex: 1;
  min-width: 0;
}
.channel-invite-form .q-btn {
  min-height: 56px;
}
.channel-member-section {
  margin-top: 28px;
}
.channel-member-section > .hint {
  margin-top: 8px;
}
.channel-member-list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}
.channel-member-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--lav);
}
.channel-member-info {
  flex: 1;
  min-width: 120px;
  overflow-wrap: anywhere;
}
.channel-member-info b,
.channel-member-info small {
  display: block;
}
.channel-member-info small {
  color: var(--muted);
  margin-top: 4px;
}
@media (max-width: 700px) {
  .channel-members-content {
    padding: 18px;
  }
  .channel-invite-form {
    flex-direction: column;
    align-items: stretch;
  }
  .channel-invite-form .q-btn {
    min-height: 44px;
  }
  .channel-member-row > .q-btn {
    margin-left: 52px;
  }
}
</style>
