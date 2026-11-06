<template>
  <AuthLayout>
    <q-form class="auth-form" novalidate @submit="submit">
      <h1>Registrácia</h1>

      <label for="register-first-name">Meno</label>
      <q-input
        for="register-first-name"
        v-model="firstName"
        class="k-input"
        borderless
        dense
        autocomplete="given-name"
        lazy-rules
        :rules="[value => required(value, 'Zadaj meno.')]"
      />

      <label for="register-last-name">Priezvisko</label>
      <q-input
        for="register-last-name"
        v-model="lastName"
        class="k-input"
        borderless
        dense
        autocomplete="family-name"
        lazy-rules
        :rules="[value => required(value, 'Zadaj priezvisko.')]"
      />

      <label for="register-nick">NickName (unikátny)</label>
      <q-input
        for="register-nick"
        v-model="nick"
        class="k-input"
        borderless
        dense
        prefix="@"
        autocomplete="username"
        lazy-rules
        hint="Použi písmená bez diakritiky, čísla, pomlčku alebo podčiarkovník."
        :rules="[validateNick]"
      />

      <label for="register-email">Email</label>
      <q-input
        for="register-email"
        v-model="email"
        class="k-input"
        borderless
        dense
        type="email"
        autocomplete="email"
        lazy-rules
        :rules="[validateEmail]"
      />

      <label for="register-password">Heslo</label>
      <q-input
        for="register-password"
        v-model="password"
        class="k-input"
        borderless
        dense
        type="password"
        autocomplete="new-password"
        lazy-rules
        hint="Aspoň 8 znakov."
        :rules="[validatePassword]"
      />

      <div
        v-if="registrationError"
        ref="errorBox"
        class="auth-error"
        role="alert"
        tabindex="-1"
      >
        <q-icon name="error_outline" size="22px" aria-hidden="true" />
        <p>{{ registrationError }}</p>
      </div>

      <q-btn
        class="k-btn dark big"
        unelevated
        no-caps
        type="submit"
        :loading="submitting"
        label="Vytvoriť účet"
      />
      <p>Už máš účet? <router-link to="/login">Prihlás sa</router-link></p>
    </q-form>
  </AuthLayout>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { registerUser } from '@/stores/auth.js'

const router = useRouter()
async function submit() {
  if (submitting.value) return
  submitting.value = true
  const error = await registerUser({
    firstName: firstName.value,
    lastName: lastName.value,
    nick: nick.value,
    email: email.value,
    password: password.value
  })
  submitting.value = false
  if (error) {
    registrationError.value = error
    await nextTick()
    if (errorBox.value) {
      errorBox.value.focus()
    }
    return
  }
  registrationError.value = ''
  router.push('/')
}

const firstName = ref('')
const lastName = ref('')
const nick = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const registrationError = ref('')
const errorBox = ref(null)

function required(value, message) {
  if (!value || !value.trim()) {
    return message
  }
  return true
}

function validateNick(value) {
  const normalized = value?.trim() || ''
  if (!normalized) return 'Zadaj nick.'
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized))
    return 'Použi nick bez medzier a diakritiky. Povolené sú aj čísla, pomlčka a podčiarkovník.'
  if (normalized.length > 32) return 'Nick môže mať najviac 32 znakov.'
  return true
}

function validateEmail(value) {
  if (!value?.trim()) return 'Zadaj email.'
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  if (!validEmail) {
    return 'Zadaj platný email, napríklad meno@example.sk.'
  }
  return true
}

function validatePassword(value) {
  if (!value) return 'Zadaj heslo.'
  if (value.trim().length < 8) {
    return 'Heslo musí mať aspoň 8 znakov.'
  }
  return true
}
</script>
