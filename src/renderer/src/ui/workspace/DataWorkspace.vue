<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ResultGrid from '../../grid/ResultGrid.vue'
import type { GridColumnDescriptor } from '../../grid/tsv'
import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import { dataSampleFor, type DataObjectKind } from './catalog'

const props = defineProps<{
  database: string
  objectKind: DataObjectKind
  objectName: string
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const { t } = useI18n()

const sample = computed(() => dataSampleFor(props.database, props.objectKind, props.objectName))

const columns = computed<GridColumnDescriptor[]>(() =>
  (sample.value?.columns ?? []).map((column) => ({
    field: column.field,
    header: column.header ?? column.field,
    align: column.align
  }))
)
</script>

<template>
  <section
    class="data-view"
    :aria-label="t('shell.workspace.data.gridLabel', { name: objectName })"
  >
    <header class="data-view__header">
      <h2 class="data-view__title">
        {{ t('shell.workspace.object.dataTitle', { name: objectName }) }}
      </h2>
      <span class="data-view__notice">{{ t('shell.workspace.demoNotice') }}</span>
    </header>

    <div class="data-view__grid">
      <ResultGrid
        :columns="columns"
        :rows="sample?.rows ?? []"
        :theme="theme"
        :locale="locale"
        test-id="data-grid"
      />
    </div>
  </section>
</template>

<style scoped>
.data-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.data-view__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--chrome-bg);
}

.data-view__title {
  margin: 0;
  font-size: var(--font-size-ui);
  font-weight: 600;
}

.data-view__notice {
  margin-left: auto;
  padding: 0 5px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;
  line-height: 15px;
}

.data-view__grid {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
