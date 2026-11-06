import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('first_name', 100).nullable()
      table.string('last_name', 100).nullable()
      table.string('nick', 32).nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropUnique(['nick'])
      table.dropColumns('first_name', 'last_name', 'nick')
    })
  }
}
