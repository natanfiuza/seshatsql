<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppIcon from '../shell/AppIcon.vue'

const { t } = useI18n()
</script>

<template>
  <section
    class="sql-log"
    :aria-label="t('shell.log.title')"
  >
    <header class="sql-log__header">
      <AppIcon
        name="log"
        :size="12"
      />
      <span class="sql-log__title">{{ t('shell.log.title') }}</span>
      <button
        type="button"
        class="sql-log__clear"
        aria-disabled="true"
        :title="`${t('shell.log.clear')} — ${t('shell.disabledHint')}`"
        @click.prevent
      >
        <AppIcon
          name="clear"
          :size="12"
        />
      </button>
    </header>
    <p class="sql-log__empty">
      {{ t('shell.log.empty') }}
    </p>
  </section>
</template>

<style scoped>
.sql-log {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.sql-log__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 4px 0 6px;
  background: var(--chrome-bg);
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-muted);
  font-size: 11px;
}

.sql-log__title {
  flex: 1 1 auto;
  min-width: 0;
}

.sql-log__clear {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: default;
}

.sql-log__clear:hover {
  background: var(--hover);
}

.sql-log__empty {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 8px;
  overflow: auto;
  color: var(--text-muted);
  font-size: 11px;
}
</style>
