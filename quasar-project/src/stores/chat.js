// Vymyslené dáta pre prototyp (1. fáza). Žijú iba v pamäti – po reloade sa obnovia.
// V 2. fáze ich nahradia dáta z backendu (AdonisJS).
import { reactive } from 'vue'

export const state = reactive({
  me: 'dano', // nick prihláseného používateľa
  profile: { firstName: 'Dano', lastName: '', email: 'dan@fan.sk' },
  notifications: true,
  onlyMentions: true, // notifikácie iba pre správy s @dano
  chatAppearance: { color: 'lav', font: 'figtree' },
  notificationFeed: [
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
      invite: true, // mám pozvánku, ešte nie som členom
      members: ['mara', 'tomas'],
      banned: [],
      kicks: {},
      notify: 'all', // notifikácie z tohto kanála: all | mentions | off
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
      kicks: {}, // { nick: počet hlasov za vyhodenie }
      notify: 'all', // notifikácie z tohto kanála: all | mentions | off
      typing: {
        nick: 'tomas',
        text: 'myslím, že infinite scroll spravíme cez q-infinite-scroll a budeme načítavať po 20 sprá'
      },
      messages: [
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
      notify: 'all', // notifikácie z tohto kanála: all | mentions | off
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
      notify: 'all', // notifikácie z tohto kanála: all | mentions | off
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

  // servery = skupiny kanálov; kanály vybraného servera sú hore v záložkách
  servers: [
    { name: 'FIIT STU', channels: ['general', 'frontend'] },
    { name: 'Tím VPWA', channels: ['vpwa-tim'] },
    { name: 'Hackathon', channels: ['hackathon'] }
  ],
  activeServer: 'FIIT STU' // práve vybraný server
})

export function findServer(name) {
  return state.servers.find(s => s.name === name)
}

export function findChannel(name) {
  return state.channels.find(c => c.name === name)
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
  if (findChannel(normalized))
    return { message: `Kanál #${normalized} už existuje.` }
  const server = findServer(serverName)
  if (!server) return { message: 'Vyber platný server.' }

  state.channels.push({
    name: normalized,
    private: isPrivate,
    admin: state.me,
    members: [state.me],
    banned: [],
    kicks: {},
    notify: 'all',
    messages: []
  })
  server.channels.push(normalized)
  state.activeServer = server.name
  return {
    message: `Kanál #${normalized} vytvorený v serveri ${server.name}.`,
    goTo: '/c/' + normalized
  }
}

// pridá moju novú správu do zoznamu správ (kanál aj súkromný chat)
export function addMessage(messages, text) {
  const time = new Date().toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  })
  messages.push({ from: state.me, text, time })
}

// staršia história pre infinite scroll (vymyslené správy pridané na začiatok)
export function addOlderMessages(messages) {
  messages.unshift(
    { from: 'peter', text: 'Postgres alebo MySQL?', time: '08:10' },
    { from: 'lucia', text: 'Postgres určite.', time: '08:12' },
    {
      from: 'mara',
      text: 'Nezabudnite si nainštalovať Quasar CLI.',
      time: '08:20'
    }
  )
}

// Spracuje príkaz z príkazového riadku.
// Vráti { message } pre notifikáciu a prípadne { goTo } – kam presmerovať.
export function runCommand(text, channel) {
  const [command, name, option] = text.trim().split(' ')
  const me = state.me

  if (command === '/join') {
    if (!name) return { message: 'Použi /join nazov-kanala [private].' }
    const existing = findChannel(name)
    if (!existing) {
      return createChannel(name, option === 'private')
    }
    if (existing.banned.includes(me))
      return { message: 'V tomto kanáli máš ban' }
    if (existing.private && !existing.members.includes(me)) {
      return { message: 'Súkromný kanál – potrebuješ pozvánku' }
    }
    if (!existing.members.includes(me)) existing.members.push(me)
    const server = state.servers.find(item => item.channels.includes(existing.name))
    if (server) state.activeServer = server.name
    return { message: `Si v #${name}`, goTo: '/c/' + name }
  }

  if (command === '/list') {
    return { message: `Členovia: ${channel.members.join(', ')}` }
  }

  if (command === '/invite') {
    if (channel.private && channel.admin !== me) {
      return { message: 'Do súkromného kanála pozýva iba správca' }
    }
    channel.banned = channel.banned.filter(n => n !== name) // správca tým zruší ban
    if (!channel.members.includes(name)) channel.members.push(name)
    return { message: `@${name} je v kanáli` }
  }

  if (command === '/revoke') {
    if (channel.admin !== me) return { message: 'Odoberať môže iba správca' }
    channel.members = channel.members.filter(n => n !== name)
    return { message: `@${name} odobratý` }
  }

  if (command === '/kick') {
    if (channel.private) return { message: 'V súkromnom kanáli použi /revoke' }
    channel.kicks[name] = (channel.kicks[name] || 0) + 1
    // správca vyhodí hneď, ostatní potrebujú 3 hlasy
    if (channel.admin === me || channel.kicks[name] >= 3) {
      channel.members = channel.members.filter(n => n !== name)
      channel.banned.push(name)
      return { message: `@${name} má trvalý ban` }
    }
    return { message: `Hlas za vyhodenie @${name}: ${channel.kicks[name]}/3` }
  }

  if (command === '/cancel' || command === '/quit') {
    // keď odíde správca (alebo dá /quit), kanál zanikne
    if (channel.admin === me) {
      state.channels.splice(state.channels.indexOf(channel), 1)
      state.servers.forEach(server => {
        server.channels = server.channels.filter(name => name !== channel.name)
      })
      return { message: `Kanál #${channel.name} zrušený`, goTo: '/' }
    }
    if (command === '/quit') return { message: 'Zrušiť kanál môže iba správca' }
    channel.members = channel.members.filter(n => n !== me)
    return { message: `Opustil si #${channel.name}`, goTo: '/' }
  }

  return {
    message:
      'Neznámy príkaz. Skús /join, /invite, /revoke, /kick, /cancel, /quit, /list'
  }
}
