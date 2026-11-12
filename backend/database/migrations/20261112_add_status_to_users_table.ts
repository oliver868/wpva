import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      // stav, ktorý si používateľ nastavil: online, dnd alebo offline
      table.string('status', 10).notNullable().defaultTo('online')
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('status')
    })
  }
}
