import { BaseSchema } from '@adonisjs/lucid/schema'

// hlasy za vyhodenie člena z verejného kanála (/kick); 3 hlasy = trvalý ban
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('channel_kick_votes', (table) => {
      table.integer('channel_id').notNullable().references('channels.id').onDelete('CASCADE')
      table.integer('target_id').notNullable().references('users.id').onDelete('CASCADE')
      table.integer('voter_id').notNullable().references('users.id').onDelete('CASCADE')
      table.primary(['channel_id', 'target_id', 'voter_id'])
    })
  }

  async down() {
    this.schema.dropTable('channel_kick_votes')
  }
}
