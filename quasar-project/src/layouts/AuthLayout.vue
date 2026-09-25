<template>
  <q-layout>
    <q-page-container>
      <div class="auth">
        <div class="auth-box">
          <div class="auth-intro">
            <span class="logo">kanál<span>!</span></span>
            <h2>Kanály, kamoši a príkazy na jednom mieste.</h2>
            <p>Pridaj sa do kanála cez /join a pozvi spolužiakov cez /invite.</p>
          </div>
          <router-view />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>
