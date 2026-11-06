import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('channels', (table) => {
      table.increments('id')
      table.string('name', 60).notNullable().unique()
      table.boolean('is_private').notNullable()
      table.integer('owner_id').notNullable().references('users.id')
      table
        .timestamp('last_activity_at', { useTz: true })
        .notNullable()
        .defaultTo(this.now())
        .index()
    })

    this.schema.createTable('channel_memberships', (table) => {
      table.integer('channel_id').notNullable().references('channels.id').onDelete('CASCADE')
      table.integer('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.boolean('is_banned').notNullable().defaultTo(false)
      table.primary(['channel_id', 'user_id'])
      table.index(['user_id'])
    })

    this.schema.createTable('channel_invitations', (table) => {
      table.integer('channel_id').notNullable().references('channels.id').onDelete('CASCADE')
      table.integer('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.integer('invited_by').notNullable().references('users.id').onDelete('CASCADE')
      table.primary(['channel_id', 'user_id'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable('channel_invitations')
    this.schema.dropTable('channel_memberships')
    this.schema.dropTable('channels')
  }
}
