/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    sessions: {
      csrf: typeof routes['auth.sessions.csrf']
      store: typeof routes['auth.sessions.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    sessions: {
      destroy: typeof routes['profile.sessions.destroy']
    }
  }
}
