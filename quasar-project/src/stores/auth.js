import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state } from './chat.js'

export const signedIn = ref(false)

const accountContexts = new Map()
const serverError = 'Pripojenie k serveru zlyhalo. Skús to znova.'
const registrationFieldErrors = new Map([
  ['firstName', 'Skontroluj meno. Môže mať najviac 100 znakov.'],
  ['lastName', 'Skontroluj priezvisko. Môže mať najviac 100 znakov.'],
  ['nick', 'Použi najviac 32 znakov. Povolené sú písmená bez diakritiky, čísla, pomlčka a podčiarkovník.'],
  ['email', 'Zadaj platný email, napríklad meno@example.sk.'],
  ['password', 'Použi heslo s dĺžkou 8 až 128 znakov.']
])
let activeAccountId
let sessionRequest

async function request(path, options = {}) {
  const response = await fetch(`/api/v1/${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
    cache: 'no-store'
  })
  const body = response.status === 204 ? null : await response.json()
  return { status: response.status, body }
}

async function post(path, data) {
  const csrf = await request('auth/csrf')
  if (csrf.status !== 200 || !csrf.body?.token) throw new Error(serverError)

  return request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf.body.token
    },
    body: JSON.stringify(data)
  })
}

function activateAccount(user) {
  const nick = user.nick ?? `account:${user.id}`
  const firstName = user.firstName ?? user.fullName ?? ''
  const lastName = user.lastName ?? ''
  const { status = 'online', ...context } = accountContexts.get(user.id) ?? {
    friends: [],
    notificationFeed: [],
    notifications: true,
    onlyMentions: true,
    chatAppearance: { color: 'lav', font: 'figtree' },
    activeServer: ''
  }

  Object.assign(state, context)
  state.profile = { firstName, lastName, email: user.email }
  state.users = {
    ...state.users,
    [nick]: {
      name: [firstName, lastName].filter(Boolean).join(' ') || nick,
      status,
      color: 'lav'
    }
  }
  state.me = nick
  activeAccountId = user.id
  signedIn.value = true
}

export function restoreSession() {
  sessionRequest ??= request('account/profile')
    .then(({ status, body }) => {
      if (status === 200) activateAccount(body.data)
    })
    .catch(() => {})

  return sessionRequest
}

export async function registerUser(user) {
  try {
    const { status, body } = await post('auth/signup', user)
    if (status === 409) return body.message
    if (status === 422) {
      return registrationFieldErrors.get(body?.errors?.[0]?.field)
        ?? 'Skontroluj dĺžku a formát zadaných údajov.'
    }
    if (status !== 201) return serverError

    activateAccount(body.data)
    return null
  } catch {
    return serverError
  }
}

export async function signIn(identifier, password) {
  try {
    const { status, body } = await post('auth/login', { identifier, password })
    if (status === 400 || status === 401 || status === 422) {
      return 'Email, nick alebo heslo nie sú správne. Skontroluj údaje a skús to znova.'
    }
    if (status !== 200) return serverError

    activateAccount(body.data)
    return null
  } catch {
    return serverError
  }
}

export function useSignOut() {
  const router = useRouter()
  const $q = useQuasar()
  const signingOut = ref(false)

  async function signOut() {
    if (signingOut.value) return
    signingOut.value = true

    try {
      const { status } = await post('account/logout', {})
      if (status !== 204 && status !== 401) throw new Error(serverError)

      accountContexts.set(activeAccountId, {
        friends: state.friends,
        notificationFeed: state.notificationFeed,
        notifications: state.notifications,
        onlyMentions: state.onlyMentions,
        chatAppearance: state.chatAppearance,
        activeServer: state.activeServer,
        status: state.users[state.me].status
      })
      activeAccountId = undefined
      signedIn.value = false
      await router.replace('/login')
    } catch {
      $q.notify('Odhlásenie zlyhalo. Skús to znova.')
    } finally {
      signingOut.value = false
    }
  }

  return { signOut, signingOut }
}
