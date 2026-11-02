<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import { objectsOfDatabase, type MockGrid, type WorkspaceTarget } from './catalog'
import MetadataGrid from './MetadataGrid.vue'

const CLICK_DELAY_MS = 250

const props = defineProps<{
  database: string
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const emit = defineEmits<{
  openObject: [target: WorkspaceTarget]
  openData: [target: WorkspaceTarget]
}>()

const { t } = useI18n()

let clickTimer: ReturnType<typeof setTimeout> | null = null

function clearClickTimer(): void {
  if (clickTimer !== null) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
}

const grid = computed<MockGrid>(() => ({
  columns: [
    { field: 'name', headerKey: 'shell.workspace.database.columns.name' },
    {
      field: 'rows',
      headerKey: 'shell.workspace.database.columns.rows',
      align: 'right',
      format: 'estimated'
    },
    {
      field: 'size',
      headerKey: 'shell.workspace.database.columns.size',
      align: 'right',
      format: 'bytes'
    },
    {
      field: 'createdAt',
      headerKey: 'shell.workspace.database.columns.createdAt',
      format: 'date'
    },
    {
      field: 'updatedAt',
      headerKey: 'shell.workspace.database.columns.updatedAt',
      format: 'date'
    },
    { field: 'engine', headerKey: 'shell.workspace.database.columns.engine' },
    { field: 'comment', headerKey: 'shell.workspace.database.columns.comment' },
    {
      field: 'type',
      headerKey: 'shell.workspace.database.columns.type',
      format: 'objectType'
    }
  ],
  rows: objectsOfDatabase(props.database).map((object) => ({
    name: object.name,
    rows: object.rows,
    size: object.sizeBytes,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
    engine: object.engine,
    comment: object.comment,
    type: object.kind,
    target: {
      kind: 'object',
      database: props.database,
      objectKind: object.kind,
      object: object.name
    } satisfies WorkspaceTarget,
    dataTarget:
      object.kind === 'event'
        ? null
        : ({
            kind: 'data',
            database: props.database,
            objectKind: object.kind,
            object: object.name
          } satisfies WorkspaceTarget)
  }))
}))

function onRowClick(row: Record<string, unknown>): void {
  clearClickTimer()
  const target = row.target as WorkspaceTarget | undefined
  if (target === undefined) {
    return
  }
  clickTimer = setTimeout(() => {
    clickTimer = null
    emit('openObject', target)
  }, CLICK_DELAY_MS)
}

function onRowDoubleClick(row: Record<string, unknown>): void {
  clearClickTimer()
  const target = row.dataTarget as WorkspaceTarget | null | undefined
  if (target !== null && target !== undefined) {
    emit('openData', target)
  }
}

watch(() => props.database, clearClickTimer)
onBeforeUnmount(clearClickTimer)
</script>

<template>
  <section
    class="database-view"
    :aria-label="t('shell.workspace.database.title', { name: props.database })"
  >
    <header class="database-view__header">
      <h2 class="database-view__title">
        {{ t('shell.workspace.database.title', { name: props.database }) }}
      </h2>
      <span class="database-view__count">{{ grid.rows.length }}</span>
      <span class="database-view__notice">{{ t('shell.workspace.demoNotice') }}</span>
    </header>

    <div class="database-view__grid">
      <MetadataGrid
        :grid="grid"
        :theme="theme"
        :locale="locale"
        test-id="database-grid"
        @row-click="onRowClick"
        @row-double-click="onRowDoubleClick"
      />
    </div>
  </section>
</template>

<style scoped>
.database-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.database-view__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--chrome-bg);
}

.database-view__title {
  margin: 0;
  font-size: var(--font-size-ui);
  font-weight: 600;
}

.database-view__count {
  color: var(--text-muted);
  font-size: 11px;
}

.database-view__notice {
  margin-left: auto;
  padding: 0 5px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;
  line-height: 15px;
}

.database-view__grid {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
