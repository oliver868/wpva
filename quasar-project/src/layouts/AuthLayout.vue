<template>
  <q-layout>
    <q-page-container>
      <div class="auth">
        <div class="auth-box">
          <div class="auth-intro">
            <span class="logo">
              <img class="logo-icon" src="/icons/kanale.svg" alt="" aria-hidden="true" />
              <span class="logo-text">Kanále</span>
            </span>
            <h2>Kanály, kamoši a príkazy na jednom mieste.</h2>
            <p>Pridaj sa do kanála cez /join a pozvi spolužiakov cez /invite.</p>
          </div>
          <router-view />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>
