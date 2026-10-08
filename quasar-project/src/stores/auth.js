import { ref } from 'vue'
import { state } from './chat.js'

export const signedIn = ref(true)

const accounts = [
  { nick: 'dano', password: 'heslo1234', context: captureContext() }
]

function normalize(value) {
  return value.trim().toLocaleLowerCase('sk')
}

function captureContext() {
  const invitations = []
  for (const channel of state.channels) {
    if (channel.invite) {
      invitations.push(channel.name)
    }
  }

  return {
    values: {
      profile: state.profile,
      friends: state.friends,
      notificationFeed: state.notificationFeed,
      notifications: state.notifications,
      onlyMentions: state.onlyMentions,
      chatAppearance: state.chatAppearance,
      activeServer: state.activeServer
    },
    invitations: invitations
  }
}

function activateAccount(account) {
  for (const previousAccount of accounts) {
    if (normalize(previousAccount.nick) === normalize(state.me)) {
      previousAccount.context = captureContext()
      break
    }
  }

  const savedValues = account.context.values
  state.profile = savedValues.profile
  state.friends = savedValues.friends
  state.notificationFeed = savedValues.notificationFeed
  state.notifications = savedValues.notifications
  state.onlyMentions = savedValues.onlyMentions
  state.chatAppearance = savedValues.chatAppearance
  state.activeServer = savedValues.activeServer
  state.me = account.nick

  for (const channel of state.channels) {
    channel.invite = account.context.invitations.includes(channel.name)
  }
  signedIn.value = true
}

export function nicknameTaken(nick) {
  const enteredNick = normalize(nick)
  for (const existingNick of Object.keys(state.users)) {
    if (normalize(existingNick) === enteredNick) {
      return true
    }
  }
  return false
}

export function emailTaken(email) {
  const enteredEmail = normalize(email)
  for (const account of accounts) {
    const accountEmail = account.context.values.profile.email
    if (normalize(accountEmail) === enteredEmail) {
      return true
    }
  }
  return false
}

export function registerUser(user) {
  const firstName = user.firstName.trim()
  const lastName = user.lastName.trim()
  const nick = user.nick.trim()
  const email = user.email.trim()

  if (nicknameTaken(nick)) {
    return 'Tento nick je už obsadený. Vyber si iný.'
  }
  if (emailTaken(email)) {
    return 'Tento email už má účet. Prihlás sa alebo použi iný email.'
  }

  let activeServer = ''
  if (state.servers.length > 0) {
    activeServer = state.servers[0].name
  }

  const account = {
    nick: nick,
    password: user.password,
    context: {
      values: {
        profile: {
          firstName: firstName,
          lastName: lastName,
          email: email
        },
        friends: [],
        notificationFeed: [],
        notifications: true,
        onlyMentions: true,
        chatAppearance: { color: 'lav', font: 'figtree' },
        activeServer: activeServer
      },
      invitations: []
    }
  }
  state.users = {
    ...state.users,
    [account.nick]: {
      name: firstName + ' ' + lastName,
      status: 'online',
      color: 'lav'
    }
  }
  accounts.push(account)
  activateAccount(account)
  return null
}

export function signIn(identifier, password) {
  const enteredIdentifier = normalize(identifier)

  for (const account of accounts) {
    const matchesNick = normalize(account.nick) === enteredIdentifier
    const accountEmail = account.context.values.profile.email
    const matchesEmail = normalize(accountEmail) === enteredIdentifier

    if (matchesNick || matchesEmail) {
      if (account.password !== password) {
        return false
      }
      activateAccount(account)
      return true
    }
  }
  return false
}
