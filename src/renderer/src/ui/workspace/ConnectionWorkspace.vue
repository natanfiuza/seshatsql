<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import AppTabStrip from '../shell/AppTabStrip.vue'
import { CONNECTION, CONNECTION_PANELS } from './catalog'
import MetadataGrid from './MetadataGrid.vue'

const props = defineProps<{
  activeSubTab: string
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const emit = defineEmits<{ 'update:activeSubTab': [id: string] }>()

const { t } = useI18n()

const tabs = computed(() =>
  CONNECTION_PANELS.map((panel) => ({
    id: panel.id,
    label: t(panel.labelKey, { count: panel.grid.rows.length })
  }))
)

const activePanel = computed(
  () =>
    CONNECTION_PANELS.find((panel) => panel.id === props.activeSubTab) ??
    CONNECTION_PANELS[0]!
)
</script>

<template>
  <section
    class="connection-view"
    :aria-label="t('shell.workspace.connection.title', { name: CONNECTION.name })"
  >
    <header class="connection-view__header">
      <h2 class="connection-view__title">
        {{ CONNECTION.name }}
      </h2>
      <span class="connection-view__server">{{ CONNECTION.host }}:{{ CONNECTION.port }}</span>
      <span class="connection-view__notice">{{ t('shell.workspace.demoNotice') }}</span>
    </header>

    <AppTabStrip
      :tabs="tabs"
      :active-id="activePanel.id"
      :label="t('shell.workspace.sectionsLabel')"
      variant="secondary"
      @select="emit('update:activeSubTab', $event)"
    />

    <div class="connection-view__grid">
      <MetadataGrid
        :grid="activePanel.grid"
        :theme="theme"
        :locale="locale"
        :test-id="`connection-grid-${activePanel.id}`"
      />
    </div>
  </section>
</template>

<style scoped>
.connection-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.connection-view__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--chrome-bg);
}

.connection-view__title {
  margin: 0;
  font-size: var(--font-size-ui);
  font-weight: 600;
}

.connection-view__server {
  color: var(--text-muted);
  font-size: 11px;
}

.connection-view__notice {
  margin-left: auto;
  padding: 0 5px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;
  line-height: 15px;
}

.connection-view__grid {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
