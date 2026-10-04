<template>
  <!-- prototyp: registrácia iba skontroluje povinné polia a presmeruje do aplikácie -->
  <AuthLayout>
    <q-form class="auth-form" @submit="submit">
      <h1>Registrácia</h1>

      <label for="register-first-name">Meno</label>
      <q-input
        for="register-first-name"
        v-model="firstName"
        class="k-input"
        borderless
        dense
        autocomplete="given-name"
        :rules="[required]"
      />

      <label for="register-last-name">Priezvisko</label>
      <q-input
        for="register-last-name"
        v-model="lastName"
        class="k-input"
        borderless
        dense
        autocomplete="family-name"
        :rules="[required]"
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
        :rules="[required]"
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
        :rules="[required]"
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
        :rules="[required]"
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

const required = value => !!value?.trim() || 'Povinné pole'
</script>
