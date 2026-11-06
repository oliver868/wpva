import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class DemoUserSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    await User.firstOrCreate(
      { nick: 'dano', email: 'dan@fan.sk' },
      { firstName: 'Dano', fullName: 'Dano', password: 'heslo1234' },
      { client: this.client }
    )
  }
}
