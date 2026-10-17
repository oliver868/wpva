<template>
  <q-layout view="lHh LpR lFf" style="min-height: 100dvh">
    <q-drawer v-model="drawer" show-if-above :width="310">
      <div class="side">
        <router-link class="logo" to="/">
          <img
            class="logo-icon"
            src="/icons/kanale.svg"
            alt=""
            aria-hidden="true"
          />
          <span class="logo-text">Kanále</span>
        </router-link>

        <q-btn
          v-if="signedIn"
          class="create"
          unelevated
          no-caps
          icon="add"
          label="Vytvoriť kanál"
          @click="openCreate()"
        />
        <q-btn
          v-if="signedIn"
          class="k-btn"
          unelevated
          no-caps
          icon="add"
          label="Vytvoriť server"
          @click="openCreateServer()"
        />

        <q-input
          v-if="signedIn"
          v-model="sidebarSearch"
          class="k-input side-search"
          borderless
          dense
          clearable
          placeholder="Kanály, priatelia, servery"
          aria-label="Hľadať kanály, priateľov a servery"
        >
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>

        <div v-if="signedIn" class="side-lists">
          <q-expansion-item
            v-model="invitationsExpanded"
            dense
            label="Pozvánky"
            header-class="side-title"
          >
            <router-link
              v-for="c in filteredInvitations"
              :key="c.name"
              :to="'/c/' + c.name"
              class="side-channel"
              :class="{
                invite: hasChannelInvitation(c),
                active: route.params.name === c.name
              }"
              @click="selectServerOf(c)"
            >
              <q-icon :name="channelIcon(c)" size="16px" aria-hidden="true" />
              <span>{{ c.name }}</span>
              <span v-if="hasChannelInvitation(c)" class="chip">pozvánka</span>
              <!-- stlmený kanál (zvonček → Stlmiť) -->
              <q-icon
                v-else-if="c.notify === 'off'"
                name="notifications_off"
                size="16px"
                aria-label="Stlmené notifikácie"
              />
            </router-link>
            <p v-if="!filteredInvitations.length" class="side-empty">
              {{
                sidebarQuery ? 'Nenašli sa pozvánky' : 'Nemáš žiadne pozvánky'
              }}
            </p>
          </q-expansion-item>

          <q-expansion-item
            v-model="friendsExpanded"
            dense
            label="Priatelia"
            header-class="side-title"
          >
            <router-link
              v-for="f in filteredFriends"
              :key="f.nick"
              :to="friendRoute(f)"
              class="friend"
              :class="{ active: route.params.nick === f.nick }"
            >
              <UserAvatar :nick="f.nick" />
              <div>
                <b>{{ f.nick }}</b>
                <small>{{ lastMessage(f) }}</small>
              </div>
            </router-link>
            <p
              v-if="sidebarQuery && !filteredFriends.length"
              class="side-empty"
            >
              Nenašli sa priatelia
            </p>
          </q-expansion-item>

          <q-expansion-item
            v-model="serversExpanded"
            dense
            label="Servery"
            header-class="side-title"
          >
            <q-expansion-item
              v-for="s in filteredServers"
              :key="s.name"
              :model-value="!!expandedServers[s.name]"
              :label="s.hasInvitation ? `${s.name} – pozvánka do kanála` : s.name"
              class="server-group"
              :header-class="[
                'server',
                {
                  active: state.activeServer === s.name,
                  invite: s.hasInvitation
                }
              ]"
              @update:model-value="expandedServers[s.name] = $event"
            >
              <template #header>
                <q-item-section avatar>
                  <q-icon name="dns" size="20px" aria-hidden="true" />
                </q-item-section>
                <q-item-section class="server-name">{{
                  s.name
                }}</q-item-section>
                <q-item-section v-if="s.hasInvitation" side>
                  <q-icon
                    name="mail_outline"
                    size="18px"
                    aria-label="Pozvánka do kanála"
                  />
                </q-item-section>
              </template>
              <router-link
                v-for="c in s.visibleChannels"
                :key="c.name"
                :to="'/c/' + c.name"
                class="side-channel"
                :class="{
                  invite: hasChannelInvitation(c),
                  active: route.params.name === c.name
                }"
                @click="selectServerOf(c)"
              >
                <q-icon :name="channelIcon(c)" size="16px" aria-hidden="true" />
                <span>{{ c.name }}</span>
                <q-icon
                  v-if="hasChannelInvitation(c)"
                  name="mail_outline"
                  size="16px"
                  aria-label="Pozvánka do kanála"
                />
                <q-icon
                  v-else-if="c.notify === 'off'"
                  name="notifications_off"
                  size="16px"
                  aria-label="Stlmené notifikácie"
                />
              </router-link>
              <p v-if="!s.visibleChannels.length" class="side-empty">
                Zatiaľ tu nemáš žiadne kanály
              </p>
            </q-expansion-item>
            <p
              v-if="sidebarQuery && !filteredServers.length"
              class="side-empty"
            >
              Nenašli sa servery
            </p>
          </q-expansion-item>
        </div>

        <div v-if="!signedIn" class="guest-account">
          <q-icon name="account_circle" size="40px" aria-hidden="true" />
          <b>Nie si prihlásený</b>
          <p>Prihlás sa a pokračuj vo svojich kanáloch.</p>
          <q-btn
            class="k-btn yellow"
            unelevated
            no-caps
            label="Prihlásiť sa"
            to="/login"
          />
          <q-btn
            class="k-btn"
            unelevated
            no-caps
            label="Vytvoriť účet"
            to="/register"
          />
        </div>
        <div v-else class="me-box">
          <q-btn
            class="profile-avatar-trigger"
            flat
            round
            dense
            :aria-label="`Zmeniť stav používateľa: ${state.users[state.me].status}`"
          >
            <UserAvatar :nick="state.me" />
            <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
              <q-list class="profile-status-menu">
                <q-item-label header>Stav používateľa</q-item-label>
                <q-item
                  v-for="s in ['online', 'dnd', 'offline']"
                  :key="s"
                  tag="button"
                  clickable
                  v-close-popup
                  class="profile-status-option"
                  :class="{ active: state.users[state.me].status === s }"
                  :aria-pressed="state.users[state.me].status === s"
                  @click="state.users[state.me].status = s"
                >
                  <q-item-section avatar>
                    <i class="status" :class="s" aria-hidden="true" />
                  </q-item-section>
                  <q-item-section>{{ s }}</q-item-section>
                  <q-item-section
                    v-if="state.users[state.me].status === s"
                    side
                  >
                    <q-icon name="check" size="16px" aria-hidden="true" />
                  </q-item-section>
                </q-item>
                <q-item
                  clickable
                  v-close-popup
                  to="/login"
                  replace
                  @click="signedIn = false"
                >
                  <q-item-section avatar
                    ><q-icon name="logout"
                  /></q-item-section>
                  <q-item-section>Odhlásiť sa</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <div>
            <b>@{{ state.me }}</b>
            <small
              >{{ state.profile.firstName }} {{ state.profile.lastName }}</small
            >
          </div>
        </div>
        <q-btn
          v-if="signedIn"
          class="k-btn"
          unelevated
          no-caps
          align="left"
          icon="settings"
          label="Nastavenia aplikácie"
          to="/settings"
        />
      </div>
    </q-drawer>

    <q-page-container>
      <div class="main">
        <div class="mobile-bar lt-md">
          <q-btn
            class="k-btn"
            unelevated
            dense
            icon="menu"
            @click="drawer = !drawer"
          />
          <span class="logo">
            <img
              class="logo-icon"
              src="/icons/kanale.svg"
              alt=""
              aria-hidden="true"
            />
            <span class="logo-text">Kanále</span>
          </span>
        </div>

        <div class="top-row">
          <div class="tabs-wrap">
          <nav
            ref="tabsBox"
            class="tabs"
            :class="{ 'tabs--more': hiddenTabs.length }"
            @scroll="countHiddenTabs"
          >
            <template v-if="(channel || invitedChannel) && signedIn">
              <router-link
                v-for="c in tabs"
                :key="c.name"
                :to="'/c/' + c.name"
                :data-channel="c.name"
                class="tab"
                :class="{ invite: hasChannelInvitation(c) }"
                :aria-label="
                  hasChannelInvitation(c)
                    ? `#${c.name} – pozvánka do kanála`
                    : undefined
                "
              >
                <q-icon v-if="c.private" name="lock" size="14px" />
                <span v-else>#</span>
                {{ c.name }}
                <q-icon
                  v-if="hasChannelInvitation(c)"
                  name="mail_outline"
                  size="14px"
                  aria-hidden="true"
                />
              </router-link>
            </template>
            <template v-else-if="friend && signedIn">
              <router-link
                v-for="thread in friend.threads"
                :key="thread.id"
                :to="friendRoute(friend, thread)"
                class="tab thread-tab"
              >
                <q-icon name="alternate_email" size="14px" />
                {{ thread.title }}
              </router-link>
            </template>
            <router-link v-else-if="isAuthPage" :to="route.path" class="tab">
              <q-icon name="account_circle" size="16px" />
              {{ route.path === "/login" ? "Prihlásenie" : "Registrácia" }}
            </router-link>
            <router-link
              v-else-if="route.name === 'home'"
              to="/home"
              class="tab"
            >
              <q-icon name="home" size="16px" />
              Prehľad
            </router-link>
          </nav>

          <!-- koľko kanálov sa nezmestilo; po kliknutí ich zoznam -->
          <q-btn
            v-if="hiddenTabs.length"
            class="tab more-tabs"
            unelevated
            dense
            no-caps
            :label="'+' + hiddenTabs.length"
            :aria-label="`Ďalšie kanály (${hiddenTabs.length})`"
          >
            <q-menu anchor="bottom right" self="top right">
              <q-list class="menu-box">
                <q-item
                  v-for="name in hiddenTabs"
                  :key="name"
                  v-close-popup
                  clickable
                  :to="'/c/' + name"
                >
                  <q-item-section># {{ name }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          </div>

          <q-btn
            v-if="friend && signedIn"
            class="tab new-thread"
            unelevated
            dense
            no-caps
            icon="add"
            :label="$q.screen.lt.sm ? 'Thread' : 'Nový thread'"
            aria-label="Vytvoriť nový thread pre tohto kamaráta"
            @click="showThreadDialog = true"
          />

          <div v-if="current && signedIn" class="top-actions">
            <q-btn
              class="tab"
              unelevated
              dense
              :icon="
                current.notify === 'off' ? 'notifications_off' : 'notifications'
              "
              :label="$q.screen.lt.sm ? '' : 'Notifikácie'"
              aria-label="Notifikácie"
            >
              <q-menu anchor="bottom right" self="top right">
                <div class="menu-box">
                  <b class="inline-details"
                    ><span>Notifikácie</span><span>{{ title }}</span></b
                  >
                  <q-option-group
                    v-model="current.notify"
                    color="positive"
                    :options="[
                      { label: 'Všetky správy', value: 'all' },
                      { label: 'Iba @zmienky', value: 'mentions' },
                      { label: 'Stlmiť', value: 'off' },
                    ]"
                  />
                </div>
              </q-menu>
            </q-btn>

            <q-btn
              class="tab"
              unelevated
              dense
              icon="tune"
              :label="$q.screen.lt.sm ? '' : 'Nastavenia'"
              aria-label="Nastavenia"
            >
              <q-menu anchor="bottom right" self="top right">
                <div class="menu-box">
                  <b class="inline-details"
                    ><span>Nastavenia</span><span>{{ title }}</span></b
                  >

                  <template v-if="channel">
                    <span>Server: {{ serverName }}</span>
                    <span
                      >Typ: {{ channel.private ? "súkromný" : "verejný" }}</span
                    >
                    <span>Správca: @{{ channel.admin }}</span>
                    <span>Členov: {{ channel.members.length }}</span>
                    <q-toggle
                      v-if="channel.admin === state.me"
                      :model-value="channel.private"
                      label="Súkromný kanál"
                      color="positive"
                      @update:model-value="updateChannelVisibility($event)"
                    />
                    <q-btn
                      v-close-popup
                      class="k-btn mint"
                      unelevated
                      no-caps
                      icon="group"
                      label="Správa členov"
                      :to="'/c/' + channel.name + '/members'"
                    />
                    <q-btn
                      v-close-popup
                      class="k-btn"
                      unelevated
                      no-caps
                      icon="add"
                      label="Pridať kanál na server"
                      @click="openCreate(serverName)"
                    />
                    <q-btn
                      v-close-popup
                      class="k-btn"
                      unelevated
                      no-caps
                      label="Opustiť kanál"
                      @click="confirmChannelExit('/cancel')"
                    />
                    <q-btn
                      v-if="channel.admin === state.me"
                      v-close-popup
                      class="k-btn danger"
                      unelevated
                      no-caps
                      label="Zrušiť kanál"
                      @click="confirmChannelExit('/quit')"
                    />
                  </template>

                  <template v-else>
                    <span>{{ state.users[friend.nick].name }}</span>
                    <span>Stav: {{ state.users[friend.nick].status }}</span>
                    <q-btn
                      v-close-popup
                      class="k-btn danger"
                      unelevated
                      no-caps
                      label="Odstrániť z priateľov"
                      @click="removeFriend"
                    />
                  </template>
                  <div class="chat-menu-appearance">
                    <b>Vzhľad chatu</b>
                    <q-select
                      v-model="state.chatAppearance.color"
                      class="k-input"
                      borderless
                      dense
                      emit-value
                      map-options
                      label="Farba správ"
                      :options="colorOptions"
                    />
                    <q-select
                      v-model="state.chatAppearance.font"
                      class="k-input"
                      borderless
                      dense
                      emit-value
                      map-options
                      label="Písmo správ"
                      :options="fontOptions"
                    />
                  </div>
                </div>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <div class="chat-view" :style="chatStyle">
          <router-view
            v-if="signedIn || isAuthPage"
            :key="route.path + ':' + signedIn"
          />
          <q-page v-else class="sheet empty" :style-fn="() => ({})">
            <q-icon name="account_circle" size="48px" aria-hidden="true" />
            <h1>Vitaj v Kanáloch</h1>
            <p>Prihlás sa alebo si vytvor účet a začni konverzáciu.</p>
            <q-btn
              class="k-btn yellow"
              unelevated
              no-caps
              label="Prihlásiť sa"
              to="/login"
            />
            <q-btn
              class="k-btn"
              unelevated
              no-caps
              label="Vytvoriť účet"
              to="/register"
            />
          </q-page>
        </div>
      </div>
    </q-page-container>

    <q-dialog
      :model-value="!!pendingExit"
      @update:model-value="pendingExit = null"
    >
      <div v-if="pendingExit" class="dialog">
        <h2>
          {{ pendingExitDeletesChannel ? "Zrušiť kanál?" : "Opustiť kanál?" }}
        </h2>
        <p v-if="pendingExitDeletesChannel">
          Odchodom správcu sa celý kanál #{{ pendingExit.name }} zruší. Všetci
          členovia stratia prístup k jeho správam.
        </p>
        <p v-else>
          Opustíš #{{ pendingExit.name }} a kanál sa odstráni z tvojho zoznamu.
          {{
            pendingExit.private
              ? "Na návrat budeš potrebovať novú pozvánku."
              : "Do verejného kanála sa môžeš neskôr znova pripojiť."
          }}
        </p>
        <div class="row justify-end q-gutter-sm">
          <q-btn
            class="k-btn"
            unelevated
            no-caps
            label="Zostať v kanáli"
            @click="pendingExit = null"
          />
          <q-btn
            class="k-btn dark"
            unelevated
            no-caps
            :label="
              pendingExitDeletesChannel ? 'Zrušiť kanál' : 'Opustiť kanál'
            "
            @click="submitChannelExit"
          />
        </div>
      </div>
    </q-dialog>

    <q-dialog v-model="showCreate">
      <q-card class="dialog">
        <q-form class="dialog-form" @submit.prevent="submitChannel">
          <h2>Nový kanál</h2>
          <template v-if="channelServerOptions.length">
            <q-input
              v-model="newName"
              class="k-input"
              borderless
              dense
              prefix="#"
              label="Názov kanála"
              placeholder="nazov-kanala"
              :rules="[validateChannelName]"
            />
            <q-select
              v-model="newServer"
              class="k-input"
              borderless
              dense
              label="Server"
              :options="channelServerOptions"
              :rules="[validateChannelServer]"
            />
            <q-toggle
              v-model="newPrivate"
              label="Súkromný kanál"
              color="positive"
            />
            <p class="hint">
              Kanál sa vytvorí na vybranom serveri. V chate ho môžeš vytvoriť aj
              príkazom /join.
            </p>
          </template>
          <template v-else>
            <p class="hint">
              Zatiaľ nie si členom žiadneho servera. Vytvor si vlastný alebo
              prijmi pozvánku do kanála.
            </p>
            <q-btn
              class="k-btn yellow"
              unelevated
              no-caps
              icon="add"
              label="Vytvoriť server"
              @click="openCreateServer()"
            />
          </template>
          <div class="row justify-end q-gutter-sm">
            <q-btn
              v-close-popup
              class="k-btn"
              unelevated
              no-caps
              label="Zrušiť"
            />
            <q-btn
              v-if="channelServerOptions.length"
              class="k-btn dark"
              unelevated
              no-caps
              type="submit"
              label="Vytvoriť"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showServerDialog">
      <q-card class="dialog">
        <q-form class="dialog-form" @submit.prevent="submitServer">
          <h2>Nový server</h2>
          <q-input
            v-model="newServerName"
            class="k-input"
            borderless
            dense
            autofocus
            maxlength="60"
            label="Názov servera"
            :rules="[validateServerName]"
          />
          <p class="hint">
            Server sa pridá do tvojho zoznamu. Potom v ňom môžeš vytvoriť
            kanály.
          </p>
          <div class="row justify-end q-gutter-sm">
            <q-btn
              v-close-popup
              class="k-btn"
              unelevated
              no-caps
              label="Zrušiť"
            />
            <q-btn
              class="k-btn dark"
              unelevated
              no-caps
              type="submit"
              label="Vytvoriť server"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showThreadDialog">
      <q-card class="dialog">
        <q-form class="dialog-form" @submit="createThread">
          <h2>Nový thread</h2>
          <q-input
            v-model="newThreadName"
            class="k-input"
            borderless
            dense
            maxlength="40"
            label="Názov threadu"
            prefix="@"
            placeholder="nazov-threadu"
            :rules="[(v) => !!v?.trim() || 'Zadaj názov threadu']"
          />
          <p class="hint">
            História správ bude patriť iba do chatu s @{{ friend?.nick }}.
          </p>
          <div class="row justify-end q-gutter-sm">
            <q-btn
              v-close-popup
              class="k-btn"
              unelevated
              no-caps
              label="Zrušiť"
            />
            <q-btn
              class="k-btn dark"
              unelevated
              no-caps
              type="submit"
              label="Vytvoriť"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import {
  state,
  findChannel,
  findServerForChannel,
  lastMessage,
  hasChannelInvitation,
  visibleChannels,
  visibleServers,
  joinedServers,
  runCommand,
  createChannel,
  createServer,
  setChannelVisibility,
} from "@/stores/chat.js";
import UserAvatar from "@/components/UserAvatar.vue";
import { signedIn } from "@/stores/auth.js";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const isAuthPage = computed(() => ["/login", "/register"].includes(route.path));
watch(
  isAuthPage,
  (value) => {
    if (value) signedIn.value = false;
  },
  { immediate: true },
);

const drawer = ref(false);
const showCreate = ref(false);
const showServerDialog = ref(false);
const newServerName = ref("");
const channelServerOptions = computed(() => {
  const names = [];
  for (const server of joinedServers()) {
    names.push(server.name);
  }
  return names;
});
const showThreadDialog = ref(false);
const pendingExit = ref(null);
const pendingExitDeletesChannel = computed(() => {
  if (!pendingExit.value) {
    return false;
  }
  return (
    pendingExit.value.command === "/quit" ||
    pendingExit.value.admin === state.me
  );
});
watch(
  () => route.fullPath,
  () => {
    pendingExit.value = null;
  },
);
const newName = ref("");
const newThreadName = ref("");
const newPrivate = ref(false);
const newServer = ref(state.activeServer);
const colorOptions = [
  { label: "Levanduľová", value: "lav" },
  { label: "Mätová", value: "mint" },
  { label: "Ružová", value: "pink-l" },
  { label: "Svetlá", value: "tint" },
];
const fontOptions = [
  { label: "Figtree", value: "figtree" },
  { label: "Systémové písmo", value: "system" },
  { label: "Serifové písmo", value: "serif" },
];
const chatStyle = computed(() => ({
  "--chat-color": `var(--${state.chatAppearance.color})`,
  "--chat-font": {
    figtree: "'Figtree', system-ui, sans-serif",
    system: "system-ui, sans-serif",
    serif: "Georgia, serif",
  }[state.chatAppearance.font],
}));
const sidebarSearch = ref('')
const invitationsExpanded = ref(true)
const friendsExpanded = ref(true)
const serversExpanded = ref(true)
const expandedServers = ref({ [state.activeServer]: true })

const sidebarQuery = computed(() => normalizeSearch(sidebarSearch.value))
const filteredInvitations = computed(() =>
  visibleChannels().filter(
    (channel) =>
      hasChannelInvitation(channel) &&
      normalizeSearch(channel.name).includes(sidebarQuery.value),
  ),
);

function selectServerOf(channel) {
  const server = findServerForChannel(channel)
  if (server) {
    state.activeServer = server.name
    expandedServers.value[server.name] = true
  }
}
watch(
  () => route.params.name,
  name => {
    const channel = findChannel(name)
    if (channel) selectServerOf(channel)
  },
  { immediate: true }
)
const filteredFriends = computed(() =>
  state.friends.filter(friend =>
    normalizeSearch(
      `${friend.nick} ${state.users[friend.nick]?.name || ''}`
    ).includes(sidebarQuery.value)
  )
)
const filteredServers = computed(() =>
  visibleServers()
    .map((server) => {
      const serverMatches = normalizeSearch(server.name).includes(sidebarQuery.value);
      const channels = visibleChannels(server.name).filter(
        (channel) =>
          serverMatches ||
          normalizeSearch(channel.name).includes(sidebarQuery.value),
      );

      return {
        name: server.name,
        hasInvitation: server.hasInvitation,
        visibleChannels: channels,
      };
    })
    .filter(
      (server) =>
        normalizeSearch(server.name).includes(sidebarQuery.value) ||
        server.visibleChannels.length > 0,
    ),
);

function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sk')
    .trim()
}

watch(sidebarSearch, value => {
  if (value?.trim()) {
    invitationsExpanded.value = true
    friendsExpanded.value = true
    serversExpanded.value = true
    for (const server of filteredServers.value) {
      expandedServers.value[server.name] = true
    }
  }
})

const tabs = computed(() => visibleChannels(state.activeServer));

// záložky, ktoré sa nezmestili do riadku (sú mimo viditeľnej časti)
const tabsBox = ref(null);
const hiddenTabs = ref([]);
function countHiddenTabs() {
  const box = tabsBox.value;
  if (!box) return;
  const visible = box.getBoundingClientRect();
  const hidden = [];
  for (const tab of box.querySelectorAll("[data-channel]")) {
    const rect = tab.getBoundingClientRect();
    if (rect.right > visible.right + 1 || rect.left < visible.left - 1) {
      hidden.push(tab.dataset.channel);
    }
  }
  hiddenTabs.value = hidden;
}
// prepočítať po zmene kanálov, servera alebo veľkosti okna
watch(
  () => [tabs.value.length, route.fullPath, state.activeServer],
  () => nextTick(countHiddenTabs),
);
onMounted(() => {
  window.addEventListener("resize", countHiddenTabs);
  nextTick(countHiddenTabs);
});
onBeforeUnmount(() => window.removeEventListener("resize", countHiddenTabs));
const invitedChannel = computed(() => {
  return tabs.value.find(
    (channel) => channel.name === route.params.name && hasChannelInvitation(channel),
  );
});

function channelIcon(channel) {
  if (hasChannelInvitation(channel)) {
    return "mail";
  }
  if (channel.private) {
    return "lock";
  }
  return "tag";
}

const channel = computed(() => {
  const currentChannel = findChannel(route.params.name);
  if (currentChannel && currentChannel.members.includes(state.me)) {
    return currentChannel;
  }
  return null;
});
const friend = computed(() =>
  state.friends.find((f) => f.nick === route.params.nick),
);
const activeThread = computed(
  () =>
    friend.value?.threads.find((t) => t.id === route.params.threadId) ||
    friend.value?.threads[0],
);
const current = computed(() => channel.value || activeThread.value);
const title = computed(() =>
  channel.value
    ? "#" + channel.value.name
    : "@" + friend.value.nick + " " + activeThread.value.title,
);
const serverName = computed(() => {
  const server = findServerForChannel(channel.value);
  if (server) return server.name;
  return "žiadny";
});

function updateChannelVisibility(isPrivate, target = channel.value) {
  if (!target) return;
  const result = setChannelVisibility(target.name, isPrivate);
  if (!result.success) $q.notify(result.message);
}
provide("updateChannelVisibility", updateChannelVisibility);

function confirmChannelExit(command, target = channel.value) {
  if (!target) return;
  if (command === "/quit" && target.admin !== state.me) {
    $q.notify("Zrušiť kanál môže iba správca");
    return;
  }
  pendingExit.value = {
    name: target.name,
    admin: target.admin,
    private: target.private,
    command,
  };
}
provide("confirmChannelExit", confirmChannelExit);

function submitChannelExit() {
  const action = pendingExit.value;
  pendingExit.value = null;
  if (!action) return;

  const target = findChannel(action.name);
  if (!target) return;
  if (!target.members.includes(state.me)) return;
  const result = runCommand(action.command, target);
  $q.notify(result.message);
  if (result.goTo) router.push(result.goTo);
}

function validateChannelName(value) {
  let name = undefined;
  if (value !== undefined && value !== null) {
    name = value.trim();
  }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    return true;
  }
  return "Použi malé písmená, čísla a pomlčky";
}

function validateChannelServer(value) {
  if (channelServerOptions.value.includes(value)) {
    return true;
  }
  return "Vyber svoj server";
}

function validateServerName(value) {
  if (value !== undefined && value !== null && value.trim()) {
    return true;
  }
  return "Zadaj názov servera";
}

function openCreate(serverName = state.activeServer) {
  newServer.value = "";
  if (channelServerOptions.value.includes(serverName)) {
    newServer.value = serverName;
  } else if (channelServerOptions.value.length > 0) {
    newServer.value = channelServerOptions.value[0];
  }
  showCreate.value = true;
}
provide("openCreateChannel", openCreate);

function openCreateServer() {
  showCreate.value = false;
  newServerName.value = "";
  showServerDialog.value = true;
}
provide("openCreateServer", openCreateServer);

function submitServer() {
  const result = createServer(newServerName.value);
  $q.notify(result.message);
  if (!result.goTo) {
    return;
  }
  showServerDialog.value = false;
  if ($q.screen.lt.md) {
    drawer.value = false;
  }
  serversExpanded.value = true;
  sidebarSearch.value = "";
  router.push(result.goTo);
}

function submitChannel() {
  const result = createChannel(
    newName.value,
    newPrivate.value,
    newServer.value,
  );
  $q.notify(result.message);
  if (!result.goTo) return;
  showCreate.value = false;
  newName.value = "";
  newPrivate.value = false;
  router.push(result.goTo);
}

function friendRoute(person, thread = person.threads[0]) {
  return "/dm/" + person.nick + "/" + thread.id;
}

function createThread() {
  const name = newThreadName.value.trim();
  if (!name || !friend.value) return;

  const alreadyExists = friend.value.threads.some(
    (thread) =>
      thread.title.toLocaleLowerCase("sk") === name.toLocaleLowerCase("sk"),
  );
  if (alreadyExists) {
    $q.notify("Thread s týmto názvom už existuje");
    return;
  }

  const thread = {
    id: `thread-${Date.now().toString(36)}-${friend.value.threads.length}`,
    title: name,
    notify: "all",
    messages: [],
  };
  friend.value.threads.push(thread);
  showThreadDialog.value = false;
  newThreadName.value = "";
  router.push(friendRoute(friend.value, thread));
  $q.notify(`Thread „${name}“ vytvorený pre @${friend.value.nick}`);
}

function removeFriend() {
  $q.notify(`@${friend.value.nick} odstránený z priateľov`);
  state.friends.splice(state.friends.indexOf(friend.value), 1);
  router.push("/");
}
</script>

<style scoped>
.server-group :deep(.server .q-item__section--avatar) {
  min-width: 20px;
  padding-right: 0;
}
.server-group :deep(.server .q-item__section--side) {
  padding-left: 0;
  color: var(--ink);
}
.server-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.server-group .side-channel,
.server-group .side-empty {
  margin-left: 20px;
}
</style>
