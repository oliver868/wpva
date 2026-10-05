<template>
  <!-- prototyp: registrácia iba skontroluje povinné polia a presmeruje do aplikácie -->
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

      <q-btn
        class="k-btn dark big"
        unelevated
        no-caps
        type="submit"
        label="Vytvoriť účet"
      />
      <p>Už máš účet? <router-link to="/login">Prihlás sa</router-link></p>
    </q-form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { signedIn } from '@/stores/auth.js'
import { state } from '@/stores/chat.js'

const router = useRouter()
function submit() {
  signedIn.value = true
  router.push('/')
}

const firstName = ref('')
const lastName = ref('')
const nick = ref('')
const email = ref('')
const password = ref('')

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
  const enteredNick = normalized.toLocaleLowerCase('sk')
  for (const existingNick of Object.keys(state.users)) {
    if (existingNick.toLocaleLowerCase('sk') === enteredNick) {
      return 'Tento nick je už obsadený. Vyber si iný.'
    }
  }
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
