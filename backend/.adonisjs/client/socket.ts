export interface AppSocket {

  readonly channels: {

    readonly 'users/:id': {

      readonly params: {

        readonly 'id': string | number

      }

      readonly channel: typeof import('#channels/account_channel').default

      readonly handlers: {

      }

    }

    readonly 'channels/:id': {

      readonly params: {

        readonly 'id': string | number

      }

      readonly channel: typeof import('#channels/chat_channel').default

      readonly handlers: {

        readonly 'typing': 'typing'

      }

    }

  }

}

