import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('channels', (table) => {
      table.string('server_name', 60).nullable()
    })
  }

  async down() {
    this.schema.alterTable('channels', (table) => {
      table.dropColumn('server_name')
    })
  }
}
