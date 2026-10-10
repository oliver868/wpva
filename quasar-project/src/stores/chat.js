import { reactive } from 'vue'

// staršia história #general, aby bolo čo načítavať pri scrolle hore (infinite scroll)
function olderMessages() {
  const texts = [
    ['lucia', 'Ahojte, vitajte v kanáli!'],
    ['mara', 'Ahoj :)'],
    ['tomas', 'Čaute.'],
    ['peter', 'Postgres alebo MySQL?'],
    ['lucia', 'Postgres určite.'],
    ['mara', 'Nezabudnite si nainštalovať Quasar CLI.']
  ]
  const messages = []
  for (let i = 0; i < 36; i++) {
    const [from, text] = texts[i % texts.length]
    const minute = String(i).padStart(2, '0')
    messages.push({ from, text, time: '08:' + minute })
  }
  return messages
}

export const state = reactive({
  me: 'dano',
  profile: { firstName: 'Dano', lastName: '', email: 'dan@fan.sk' },
  notifications: true,
  onlyMentions: true,
  chatAppearance: { color: 'lav', font: 'figtree' },
  notificationFeed: [
    {
      id: 'closed-stary-projekt',
      icon: 'history_toggle_off',
      title: 'Kanál #stary-projekt zanikol',
      detail: '30 dní v ňom nepribudla žiadna správa.',
      to: '/c/stary-projekt',
      read: false
    },
    {
      id: 'mention-frontend',
      title: 'Zmienka v #frontend',
      detail: '@lucia: @dano pozrieš mi potom farby?',
      to: '/c/frontend',
      read: false
    },
    {
      id: 'message-mara',
      title: 'Nová správa od @mara',
      detail: 'Nezabudni na link na repo :)',
      to: '/dm/mara/main',
      read: false
    }
  ],

  closedChannels: [
    {
      name: 'stary-projekt',
      reason: 'inactive',
      by: 'mara',
      date: '2. 10. 2026'
    }
  ],

  users: {
    dano: { name: 'Dano', status: 'online', color: 'lav' },
    mara: { name: 'Mária S.', status: 'online', color: 'pink' },
    tomas: { name: 'Tomáš B.', status: 'dnd', color: 'blue' },
    lucia: { name: 'Lucia P.', status: 'offline', color: 'yellow' },
    peter: { name: 'Peter M.', status: 'offline', color: 'lav' }
  },

  channels: [
    {
      name: 'hackathon',
      private: true,
      admin: 'mara',
      invitations: [{ nick: 'dano', from: 'mara' }],
      members: ['mara', 'tomas'],
      banned: [],
      kicks: {},
      notify: 'all',
      messages: [
        {
          from: 'mara',
          text: 'Ideme na FIIT hackathon v novembri?',
          time: '09:12'
        }
      ]
    },
    {
      name: 'general',
      private: false,
      admin: 'mara',
      members: ['mara', 'dano', 'tomas', 'lucia', 'peter'],
      banned: [],
      kicks: {},
      notify: 'all',
      typing: {
        nick: 'tomas',
        text: 'myslím, že infinite scroll spravíme cez q-infinite-scroll a budeme načítavať po 20 sprá'
      },
      messages: [
        ...olderMessages(),
        {
          from: 'mara',
          text: 'Ráno! Kto ide dnes na cvičenie z VPWA?',
          time: '10:02'
        },
        {
          from: 'peter',
          text: 'Ja idem, len ešte dorábam UML diagram.',
          time: '10:04'
        },
        {
          from: 'tomas',
          text: 'Ahojte, ako funguje /invite v súkromnom kanáli?',
          time: '10:11'
        },
        {
          from: 'dano',
          text: 'Do súkromného kanála pozýva iba správca.',
          time: '10:12'
        },
        {
          from: 'mara',
          text: '@dano pošleš mi potom link na repo?',
          time: '10:15'
        },
        {
          from: 'lucia',
          text: 'Termín prvej fázy je 18. 10. Nezabudnite na UML.',
          time: '10:16'
        },
        { from: 'dano', text: 'Jasné, večer to pushnem.', time: '10:17' }
      ]
    },
    {
      name: 'frontend',
      private: false,
      admin: 'lucia',
      members: ['lucia', 'dano'],
      banned: [],
      kicks: {},
      notify: 'all',
      messages: [
        { from: 'lucia', text: 'Kto robí layout pre login?', time: '09:40' },
        { from: 'lucia', text: '@dano pozrieš mi potom farby?', time: '09:48' }
      ]
    },
    {
      name: 'vpwa-tim',
      private: true,
      admin: 'dano',
      members: ['dano'],
      banned: [],
      kicks: {},
      notify: 'all',
      messages: [
        { from: 'dano', text: 'UML je hotové, pozri repo.', time: '21:20' }
      ]
    }
  ],

  friends: [
    {
      nick: 'mara',
      threads: [
        {
          id: 'main',
          title: 'Hlavný chat',
          notify: 'all',
          messages: [
            {
              from: 'mara',
              text: 'Nezabudni na link na repo :)',
              time: '09:35'
            }
          ]
        }
      ]
    },
    {
      nick: 'tomas',
      threads: [
        {
          id: 'main',
          title: 'Hlavný chat',
          notify: 'all',
          messages: [
            { from: 'tomas', text: 'Vďaka za pomoc s /invite!', time: 'Včera' }
          ]
        }
      ]
    },
    {
      nick: 'lucia',
      threads: [
        {
          id: 'main',
          title: 'Hlavný chat',
          notify: 'all',
          messages: [
            { from: 'lucia', text: 'Uvidíme sa v utorok.', time: 'Po' }
          ]
        }
      ]
    }
  ],

  servers: [
    { name: 'FIIT STU', channels: ['general', 'frontend'] },
    { name: 'Tím VPWA', channels: ['vpwa-tim'] },
    { name: 'Hackathon', channels: ['hackathon'] }
  ],
  activeServer: 'FIIT STU'
})

export function findServer(name) {
  return state.servers.find(server => server.name === name)
}

export function findChannel(name) {
  return state.channels.find(channel => channel.name === name)
}

export function channelInvitation(channel, nick = state.me) {
  if (!channel || !channel.invitations) {
    return undefined
  }
  for (const invitation of channel.invitations) {
    if (invitation.nick === nick) {
      return invitation
    }
  }
  return undefined
}

export function hasChannelInvitation(channel, nick = state.me) {
  return channelInvitation(channel, nick) !== undefined
}

function removeChannelInvitation(channel, nick) {
  const remainingInvitations = []
  if (channel.invitations) {
    for (const invitation of channel.invitations) {
      if (invitation.nick !== nick) {
        remainingInvitations.push(invitation)
      }
    }
  }
  channel.invitations = remainingInvitations
}

export function acceptChannelInvitation(channel) {
  if (!channel || !state.channels.includes(channel)) {
    return { message: 'Kanál už neexistuje.', success: false }
  }
  if (channel.banned.includes(state.me)) {
    return { message: 'V tomto kanáli máš ban.', success: false }
  }
  if (!hasChannelInvitation(channel)) {
    return { message: 'Do tohto kanála nemáš pozvánku.', success: false }
  }

  removeChannelInvitation(channel, state.me)
  if (!channel.members.includes(state.me)) {
    channel.members.push(state.me)
  }
  for (const server of state.servers) {
    if (server.channels.includes(channel.name)) {
      state.activeServer = server.name
      break
    }
  }
  return { message: `Prijal si pozvánku do #${channel.name}.`, success: true }
}

export function declineChannelInvitation(channel) {
  if (!hasChannelInvitation(channel)) {
    return { message: 'Do tohto kanála nemáš pozvánku.', success: false }
  }
  removeChannelInvitation(channel, state.me)
  return { message: `Odmietol si pozvánku do #${channel.name}.`, success: true }
}

export function isServerMember(serverName) {
  const server = findServer(serverName)
  if (!server) {
    return false
  }
  if (server.admin === state.me) {
    return true
  }
  for (const name of server.channels) {
    const channel = findChannel(name)
    if (!channel || hasChannelInvitation(channel)) {
      continue
    }
    if (
      channel.members.includes(state.me) &&
      !channel.banned.includes(state.me)
    ) {
      return true
    }
  }
  return false
}

export function joinedServers() {
  const servers = []
  for (const server of state.servers) {
    if (isServerMember(server.name)) {
      servers.push(server)
    }
  }
  return servers
}

export function createServer(name) {
  const serverName = name.trim()
  if (!serverName || serverName.length > 60) {
    return { message: 'Zadaj názov servera s najviac 60 znakmi.' }
  }
  for (const server of state.servers) {
    if (
      server.name.toLocaleLowerCase('sk') === serverName.toLocaleLowerCase('sk')
    ) {
      return { message: 'Server s týmto názvom už existuje. Vyber iný názov.' }
    }
  }

  state.servers.push({ name: serverName, admin: state.me, channels: [] })
  state.activeServer = serverName
  return { message: `Server ${serverName} vytvorený.`, goTo: '/home' }
}

export function setChannelVisibility(name, isPrivate) {
  const channel = findChannel(name)
  if (!channel) {
    return { message: 'Kanál už neexistuje.', success: false }
  }
  if (
    channel.admin !== state.me ||
    !channel.members.includes(state.me) ||
    channel.banned.includes(state.me)
  ) {
    return {
      message: 'Viditeľnosť môže meniť iba správca, ktorý je členom kanála.',
      success: false
    }
  }
  if (typeof isPrivate !== 'boolean') {
    return { message: 'Vyber verejný alebo súkromný kanál.', success: false }
  }

  channel.private = isPrivate
  let visibility = 'verejný'
  if (isPrivate) {
    visibility = 'súkromný'
  }
  return {
    message: `Kanál #${channel.name} je teraz ${visibility}.`,
    success: true
  }
}

export function visibleChannels(serverName) {
  const invitedChannels = []
  const joinedChannels = []
  const server = findServer(serverName)

  for (const channel of state.channels) {
    if (serverName !== undefined) {
      if (!server || !server.channels.includes(channel.name)) {
        continue
      }
    }
    if (channel.banned.includes(state.me)) {
      continue
    }
    if (hasChannelInvitation(channel)) {
      invitedChannels.push(channel)
    } else if (channel.members.includes(state.me)) {
      joinedChannels.push(channel)
    }
  }

  return invitedChannels.concat(joinedChannels)
}

export function visibleServers() {
  const channels = visibleChannels()
  const invitedServers = []
  const joinedServers = []

  for (const server of state.servers) {
    const invitedNames = []
    const joinedNames = []

    for (const name of server.channels) {
      const channel = channels.find(channel => channel.name === name)
      if (!channel) {
        continue
      }
      if (hasChannelInvitation(channel)) {
        invitedNames.push(name)
      } else {
        joinedNames.push(name)
      }
    }

    const channelNames = invitedNames.concat(joinedNames)
    if (channelNames.length === 0 && !isServerMember(server.name)) {
      continue
    }

    const visibleServer = {
      name: server.name,
      channels: channelNames,
      hasInvitation: invitedNames.length > 0
    }
    if (visibleServer.hasInvitation) {
      invitedServers.push(visibleServer)
    } else {
      joinedServers.push(visibleServer)
    }
  }

  return invitedServers.concat(joinedServers)
}

export function createChannel(
  name,
  isPrivate,
  serverName = state.activeServer
) {
  const normalized = name.trim().replace(/^#/, '').toLocaleLowerCase('sk')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return {
      message: 'Názov kanála môže obsahovať iba malé písmená, čísla a pomlčky.'
    }
  }
  if (findChannel(normalized)) {
    return { message: `Kanál #${normalized} už existuje.` }
  }
  const server = findServer(serverName)
  if (!server) {
    return { message: 'Vyber platný server.' }
  }
  if (!isServerMember(server.name)) {
    return {
      message:
        'Na tomto serveri nie si členom. Najprv sa pripoj do jeho kanála.'
    }
  }

  state.channels.push({
    name: normalized,
    private: isPrivate,
    admin: state.me,
    invitations: [],
    members: [state.me],
    banned: [],
    kicks: {},
    notify: 'all',
    messages: []
  })
  server.channels.push(normalized)
  state.activeServer = server.name
  const closedChannels = []
  for (const closedChannel of state.closedChannels) {
    if (closedChannel.name !== normalized) {
      closedChannels.push(closedChannel)
    }
  }
  state.closedChannels = closedChannels
  return {
    message: `Kanál #${normalized} vytvorený v serveri ${server.name}.`,
    goTo: '/c/' + normalized
  }
}

export function addMessage(messages, text) {
  const time = new Date().toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  })
  messages.push({ from: state.me, text, time })
}

export function runCommand(text, channel) {
  const parts = text.trim().split(/\s+/)
  const command = parts[0]
  const name = parts[1]
  const option = parts[2]
  const me = state.me

  if (command === '/join') {
    if (!name) {
      return { message: 'Použi /join nazov-kanala [private].' }
    }
    const existing = findChannel(name)
    if (!existing) {
      return createChannel(name, option === 'private')
    }
    if (existing.banned.includes(me)) {
      return { message: 'V tomto kanáli máš ban' }
    }
    if (hasChannelInvitation(existing)) {
      for (const server of state.servers) {
        if (server.channels.includes(existing.name)) {
          state.activeServer = server.name
          break
        }
      }
      return {
        message: 'Najprv prijmi alebo odmietni pozvánku do tohto kanála.',
        goTo: '/c/' + name
      }
    }
    if (
      existing.private &&
      existing.admin !== me &&
      !existing.members.includes(me)
    ) {
      return { message: 'Súkromný kanál – potrebuješ pozvánku' }
    }
    if (!existing.members.includes(me)) {
      existing.members.push(me)
    }
    const server = state.servers.find(item =>
      item.channels.includes(existing.name)
    )
    if (server) {
      state.activeServer = server.name
    }
    return { message: `Si v #${name}`, goTo: '/c/' + name }
  }

  if (command === '/list') {
    return { message: `Členovia: ${channel.members.join(', ')}` }
  }

  if (command === '/invite') {
    if (!channel || !state.channels.includes(channel)) {
      return { message: 'Príkaz /invite použi v existujúcom kanáli.' }
    }
    if (
      !channel.members.includes(me) ||
      channel.banned.includes(me) ||
      hasChannelInvitation(channel)
    ) {
      return { message: 'Pozývať môže iba člen tohto kanála.' }
    }
    if (channel.private && channel.admin !== me) {
      return { message: 'Do súkromného kanála pozýva iba správca' }
    }
    let nickname = ''
    if (name) {
      nickname = name.replace(/^@/, '')
    }
    if (!nickname || parts.length !== 2) {
      return { message: 'Použi /invite nick.' }
    }
    let nick = ''
    for (const userNick of Object.keys(state.users)) {
      if (
        userNick.toLocaleLowerCase('sk') === nickname.toLocaleLowerCase('sk')
      ) {
        nick = userNick
        break
      }
    }
    if (!nick) {
      return { message: `Používateľ @${nickname} neexistuje.` }
    }
    if (channel.members.includes(nick)) {
      return { message: `@${nick} už je členom tohto kanála.` }
    }
    if (hasChannelInvitation(channel, nick)) {
      return { message: `@${nick} už má pozvánku do tohto kanála.` }
    }
    if (channel.banned.includes(nick) && channel.admin !== me) {
      return {
        message: 'Prístup zablokovanému používateľovi môže obnoviť iba správca.'
      }
    }
    const bannedMembers = []
    for (const bannedNick of channel.banned) {
      if (bannedNick !== nick) {
        bannedMembers.push(bannedNick)
      }
    }
    channel.banned = bannedMembers
    delete channel.kicks[nick]
    if (channel.invitations === undefined || channel.invitations === null) {
      channel.invitations = []
    }
    channel.invitations.push({ nick, from: me })
    return {
      message: `Pozvánka pre @${nick} do #${channel.name} bola odoslaná.`
    }
  }

  if (command === '/revoke') {
    if (!channel) {
      return { message: 'Príkaz /revoke použi v súkromnom kanáli.' }
    }
    if (channel.admin !== me) {
      return { message: 'Odoberať môže iba správca' }
    }
    if (
      !channel.members.includes(me) ||
      channel.banned.includes(me) ||
      hasChannelInvitation(channel)
    ) {
      return { message: 'Najprv sa pripoj do tohto kanála.' }
    }
    if (!channel.private) {
      return { message: 'Vo verejnom kanáli použi /kick nick.' }
    }
    let nickname = ''
    if (name) {
      nickname = name.replace(/^@/, '')
    }
    if (!nickname || parts.length !== 2) {
      return { message: 'Použi /revoke nick.' }
    }
    let member = ''
    for (const memberNick of channel.members) {
      if (
        memberNick.toLocaleLowerCase('sk') === nickname.toLocaleLowerCase('sk')
      ) {
        member = memberNick
        break
      }
    }
    if (!member) {
      return { message: `@${nickname} nie je členom tohto kanála.` }
    }
    if (member === channel.admin) {
      return {
        message: 'Správcu nemožno odobrať. Na zrušenie kanála použi /quit.'
      }
    }
    const remainingMembers = []
    for (const nick of channel.members) {
      if (nick !== member) {
        remainingMembers.push(nick)
      }
    }
    channel.members = remainingMembers
    delete channel.kicks[member]
    return { message: `@${member} už nemá prístup do #${channel.name}.` }
  }

  if (command === '/kick') {
    if (channel.private) {
      return { message: 'V súkromnom kanáli použi /revoke' }
    }
    channel.kicks[name] = (channel.kicks[name] || 0) + 1

    if (channel.admin === me || channel.kicks[name] >= 3) {
      channel.members = channel.members.filter(nick => nick !== name)
      removeChannelInvitation(channel, name)
      channel.banned.push(name)
      return { message: `@${name} má trvalý ban` }
    }
    return { message: `Hlas za vyhodenie @${name}: ${channel.kicks[name]}/3` }
  }

  if (command === '/cancel' || command === '/quit') {
    if (!channel || !channel.members.includes(me)) {
      return { message: 'Nie si členom tohto kanála' }
    }
    if (command === '/quit' && channel.admin !== me) {
      return { message: 'Zrušiť kanál môže iba správca' }
    }
    if (channel.admin === me) {
      state.channels.splice(state.channels.indexOf(channel), 1)
      for (const server of state.servers) {
        server.channels = server.channels.filter(name => name !== channel.name)
      }
      state.closedChannels.push({
        name: channel.name,
        reason: 'deleted',
        by: me,
        date: new Date().toLocaleDateString('sk-SK')
      })
      return { message: `Kanál #${channel.name} zrušený`, goTo: '/' }
    }
    channel.members = channel.members.filter(nick => nick !== me)
    removeChannelInvitation(channel, me)
    return { message: `Opustil si #${channel.name}`, goTo: '/' }
  }

  return {
    message:
      'Neznámy príkaz. Skús /join, /invite, /revoke, /kick, /cancel, /quit, /list'
  }
}
