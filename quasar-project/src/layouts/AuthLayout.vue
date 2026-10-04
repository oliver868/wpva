<template>
  <q-page class="sheet auth-sheet" :style-fn="() => ({})">
    <div class="auth auth-in-app">
      <div class="auth-box">
        <div class="auth-intro">
          <span class="logo">
            <img
              class="logo-icon"
              src="/icons/kanale.svg"
              alt=""
              aria-hidden="true"
            />
            <span class="logo-text">Kanále</span>
          </span>
          <h2>Kanály, kamoši a príkazy na jednom mieste.</h2>
          <p>Pridaj sa do kanála cez /join a pozvi spolužiakov cez /invite.</p>
        </div>
        <slot />
      </div>
    </div>
  </q-page>
</template>
