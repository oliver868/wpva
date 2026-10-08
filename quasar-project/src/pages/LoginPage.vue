<template>
  <AuthLayout>
    <q-form class="auth-form" novalidate @submit="submit">
      <h1>Prihlásenie</h1>

      <label for="login-name">Email alebo nickName</label>
      <q-input
        for="login-name"
        v-model="login"
        class="k-input"
        borderless
        dense
        autocomplete="username"
        lazy-rules
        :aria-describedby="loginError ? 'login-error' : undefined"
        @update:model-value="loginError = ''"
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
        lazy-rules
        :aria-describedby="loginError ? 'login-error' : undefined"
        @update:model-value="loginError = ''"
        :rules="[value => !!value || 'Zadaj heslo.']"
      />

      <div
        v-if="loginError"
        id="login-error"
        ref="errorBox"
        class="auth-error"
        role="alert"
        tabindex="-1"
      >
        <q-icon name="error_outline" size="22px" aria-hidden="true" />
        <p>{{ loginError }}</p>
      </div>

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
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { signIn } from '@/stores/auth.js'

const router = useRouter()
async function submit() {
  if (!signIn(login.value, password.value)) {
    loginError.value =
      'Email, nick alebo heslo nie sú správne. Skontroluj údaje a skús to znova.'
    await nextTick()
    errorBox.value?.focus()
    return
  }
  loginError.value = ''
  router.push('/')
}

const login = ref('dan@fan.sk')
const password = ref('heslo1234')
const loginError = ref('')
const errorBox = ref(null)
</script>
