import { BaseSchema } from '@adonisjs/lucid/schema'

// správy v kanáloch; @nickname sa vyhodnocuje z textu správy
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('messages', (table) => {
      table.increments('id')
      table.integer('channel_id').notNullable().references('channels.id').onDelete('CASCADE')
      table.integer('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.text('text').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.index(['channel_id', 'id'])
    })
  }

  async down() {
    this.schema.dropTable('messages')
  }
}
