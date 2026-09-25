<template>
  <!-- prototyp: registrácia iba skontroluje povinné polia a presmeruje do aplikácie -->
  <q-form class="auth-form" @submit="$router.push('/')">
    <h1>Registrácia</h1>

    <label>Meno</label>
    <q-input v-model="firstName" class="k-input" borderless dense :rules="[required]" />

    <label>Priezvisko</label>
    <q-input v-model="lastName" class="k-input" borderless dense :rules="[required]" />

    <label>NickName (unikátny)</label>
    <q-input v-model="nick" class="k-input" borderless dense prefix="@" :rules="[required]" />

    <label>Email</label>
    <q-input v-model="email" class="k-input" borderless dense type="email" :rules="[required]" />

    <label>Heslo</label>
    <q-input v-model="password" class="k-input" borderless dense type="password" :rules="[required]" />

    <q-btn class="k-btn dark big" unelevated no-caps type="submit" label="Vytvoriť účet" />
    <p>Už máš účet? <router-link to="/login">Prihlás sa</router-link></p>
  </q-form>
</template>

<script setup>
import { ref } from 'vue'

const firstName = ref('')
const lastName = ref('')
const nick = ref('')
const email = ref('')
const password = ref('')

const required = value => !!value || 'Povinné pole'
</script>
