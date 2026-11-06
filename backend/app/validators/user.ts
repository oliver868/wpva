import vine from '@vinejs/vine'

const name = () => vine.string().trim().minLength(1).maxLength(100)

export const signupValidator = vine.create({
  firstName: name(),
  lastName: name(),
  nick: vine
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/)
    .maxLength(32),
  email: vine.string().trim().toLowerCase().email().maxLength(254),
  password: vine.string().minLength(8).maxLength(128),
})

export const loginValidator = vine.create({
  identifier: vine.string().trim().toLowerCase().minLength(1).maxLength(254),
  password: vine.string().minLength(1).maxLength(128),
})
