<template>
  <!-- prototyp: prihlásenie iba presmeruje do aplikácie (overenie príde s backendom) -->
  <q-form class="auth-form" @submit="$router.push('/')">
    <h1>Prihlásenie</h1>

    <label>Email alebo nickName</label>
    <q-input v-model="login" class="k-input" borderless dense />

    <label>Heslo</label>
    <q-input v-model="password" class="k-input" borderless dense type="password" />

    <q-btn class="k-btn dark big" unelevated no-caps type="submit" label="Prihlásiť sa" />
    <p>Nemáš účet? <router-link to="/register">Zaregistruj sa</router-link></p>
  </q-form>
</template>

<script setup>
import { ref } from 'vue'

const login = ref('dan@fan.sk')
const password = ref('heslo1234')
</script>
