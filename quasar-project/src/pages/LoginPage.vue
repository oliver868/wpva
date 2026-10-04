<template>
  <!-- prototyp: prihlásenie iba presmeruje do aplikácie (overenie príde s backendom) -->
  <AuthLayout>
    <q-form class="auth-form" @submit="submit">
      <h1>Prihlásenie</h1>

      <label for="login-name">Email alebo nickName</label>
      <q-input
        for="login-name"
        v-model="login"
        class="k-input"
        borderless
        dense
        autocomplete="username"
        :rules="[value => !!value?.trim() || 'Zadaj email alebo nick.']"
      />

      <label for="login-password">Heslo</label>
      <q-input
        for="login-password"
        v-model="password"
        class="k-input"
        borderless
        dense
        type="password"
        autocomplete="current-password"
        :rules="[value => !!value || 'Zadaj heslo.']"
      />

      <q-btn
        class="k-btn dark big"
        unelevated
        no-caps
        type="submit"
        label="Prihlásiť sa"
      />
      <p
        >Nemáš účet? <router-link to="/register">Zaregistruj sa</router-link></p
      >
    </q-form>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { signedIn } from '@/stores/auth.js'

const router = useRouter()
function submit() {
  signedIn.value = true
  router.push('/')
}

const login = ref('dan@fan.sk')
const password = ref('heslo1234')
</script>
