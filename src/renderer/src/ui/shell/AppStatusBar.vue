<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ detail: string }>()

const { t } = useI18n()
</script>

<template>
  <footer class="statusbar">
    <span class="statusbar__segment">
      {{ t('shell.status.disconnected') }}
    </span>
    <span
      class="statusbar__segment statusbar__segment--detail"
      role="status"
      aria-live="polite"
    >
      {{ detail }}
    </span>
    <span class="statusbar__segment statusbar__segment--brand">
      {{ t('shell.status.sample') }} · {{ t('app.name') }}
    </span>
  </footer>
</template>

<style scoped>
.statusbar {
  display: flex;
  flex: none;
  align-items: center;
  height: var(--status-h);
  background: var(--chrome-bg);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text);
  user-select: none;
}

.statusbar__segment {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 6px;
  border-right: 1px solid var(--border-soft);
  white-space: nowrap;
}

.statusbar__segment--detail {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  border-right: 1px solid var(--border-soft);
}

.statusbar__segment--brand {
  border-right: 0;
  color: var(--text-muted);
}
</style>
