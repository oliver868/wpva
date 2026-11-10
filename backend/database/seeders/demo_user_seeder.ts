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

      await trx
        .insertQuery()
        .table('servers')
        .insert([
          { name: 'FIIT STU', owner_id: dano.id },
          { name: 'Tím VPWA', owner_id: dano.id },
        ])
        .onConflict()
        .ignore()
      const servers = await trx
        .from('servers')
        .where('owner_id', dano.id)
        .whereIn('name', ['FIIT STU', 'Tím VPWA'])
        .select('id', 'name')
      const serverIds = new Map(servers.map((server) => [server.name, server.id]))
      const demoChannels = [
        {
          name: 'general',
          server_id: serverIds.get('FIIT STU'),
          is_private: false,
          owner_id: dano.id,
        },
        {
          name: 'frontend',
          server_id: serverIds.get('FIIT STU'),
          is_private: false,
          owner_id: dano.id,
        },
        {
          name: 'vpwa-tim',
          server_id: serverIds.get('Tím VPWA'),
          is_private: true,
          owner_id: dano.id,
        },
      ].filter((channel) => channel.server_id !== undefined)
      if (!demoChannels.length) return

      const channels = await trx
        .insertQuery()
        .table('channels')
        .insert(demoChannels)
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
