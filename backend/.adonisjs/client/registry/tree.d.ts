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
  channels: {
    channels: {
      index: typeof routes['channels.channels.index']
      store: typeof routes['channels.channels.store']
      leave: typeof routes['channels.channels.leave']
      destroy: typeof routes['channels.channels.destroy']
      updateVisibility: typeof routes['channels.channels.update_visibility']
      respondToInvitation: typeof routes['channels.channels.respond_to_invitation']
    }
  }
}
