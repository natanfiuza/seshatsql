<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="app">
    <h1 class="app__title">
      {{ t('app.name') }}
    </h1>
    <p class="app__tagline">
      {{ t('app.tagline') }}
    </p>
  </main>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  font-family: system-ui, sans-serif;
}

.app__title {
  font-size: 1.75rem;
  font-weight: 600;
}

.app__tagline {
  font-size: 1rem;
  opacity: 0.75;
}
</style>
