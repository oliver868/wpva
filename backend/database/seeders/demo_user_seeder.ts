import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class DemoUserSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    await this.client.transaction(async (trx) => {
      const dano = await User.firstOrCreate(
        { nick: 'dano', email: 'dan@fan.sk' },
        { firstName: 'Dano', fullName: 'Dano', password: 'heslo1234' },
        { client: trx }
      )

      const channels = await trx
        .insertQuery()
        .table('channels')
        .insert([
          { name: 'general', server_name: 'FIIT STU', is_private: false, owner_id: dano.id },
          { name: 'frontend', server_name: 'FIIT STU', is_private: false, owner_id: dano.id },
          { name: 'vpwa-tim', server_name: 'Tím VPWA', is_private: true, owner_id: dano.id },
        ])
        .onConflict('name')
        .ignore()
        .returning('id')

      if (channels.length) {
        await trx
          .insertQuery()
          .table('channel_memberships')
          .insert(channels.map(({ id }) => ({ channel_id: id, user_id: dano.id })))
      }
    })
  }
}
