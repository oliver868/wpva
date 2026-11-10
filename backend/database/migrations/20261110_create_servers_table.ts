import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('servers', (table) => {
      table.increments('id')
      table.string('name', 60).notNullable()
      table.integer('owner_id').notNullable().references('users.id')
    })
    this.schema.raw('CREATE UNIQUE INDEX servers_name_unique ON servers (lower(name))')
    this.schema.alterTable('channels', (table) => {
      table.integer('server_id').nullable().references('servers.id').index()
    })
    this.schema.raw(`
      INSERT INTO servers (name, owner_id)
      SELECT min(server_name), min(owner_id)
      FROM channels WHERE server_name IS NOT NULL
      GROUP BY lower(server_name)
    `)
    this.schema.raw(`
      UPDATE channels SET server_id = servers.id
      FROM servers WHERE lower(channels.server_name) = lower(servers.name)
    `)
    this.schema.alterTable('channels', (table) => {
      table.dropColumn('server_name')
    })
  }

  async down() {
    this.schema.alterTable('channels', (table) => {
      table.string('server_name', 60).nullable()
    })
    this.schema.raw(`
      UPDATE channels SET server_name = servers.name
      FROM servers WHERE channels.server_id = servers.id
    `)
    this.schema.alterTable('channels', (table) => {
      table.dropColumn('server_id')
    })
    this.schema.dropTable('servers')
  }
}
