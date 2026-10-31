<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppIcon from '../shell/AppIcon.vue'

const { t } = useI18n()
</script>

<template>
  <aside
    class="helpers"
    :aria-label="t('shell.helpers.title')"
  >
    <header class="helpers__header">
      <AppIcon
        name="history"
        :size="12"
      />
      <span>{{ t('shell.helpers.title') }}</span>
    </header>
    <p class="helpers__empty">
      {{ t('shell.helpers.empty') }}
    </p>
  </aside>
</template>

<style scoped>
.helpers {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.helpers__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 6px;
  background: var(--chrome-bg);
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-muted);
  font-size: 11px;
}

.helpers__empty {
  margin: 8px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.4;
}
</style>
