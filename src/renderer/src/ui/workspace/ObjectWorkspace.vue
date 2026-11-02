<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MonacoEditor from '../../editor/MonacoEditor.vue'
import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import AppTabStrip from '../shell/AppTabStrip.vue'
import type { MockField, MockGrid, MockObject, WorkspaceTarget } from './catalog'
import { formatFieldValue } from './format'
import MetadataGrid from './MetadataGrid.vue'

const props = defineProps<{
  object: MockObject
  activeSubTab: string
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const emit = defineEmits<{
  'update:activeSubTab': [id: string]
  openData: [target: WorkspaceTarget]
}>()

const { t } = useI18n()

function translate(key: string): string {
  return t(key)
}

const TITLE_KEYS = {
  table: 'shell.workspace.object.tableTitle',
  view: 'shell.workspace.object.viewTitle',
  event: 'shell.workspace.object.eventTitle'
} as const

const titleKey = computed(() => TITLE_KEYS[props.object.kind])

const subTabs = computed(() => {
  const tabs = [
    { id: 'basic', label: t('shell.workspace.object.subTabs.basic') },
    { id: 'options', label: t('shell.workspace.object.subTabs.options') }
  ]
  if (props.object.kind === 'table') {
    tabs.push(
      { id: 'indexes', label: t('shell.workspace.object.subTabs.indexes') },
      { id: 'foreignKeys', label: t('shell.workspace.object.subTabs.foreignKeys') },
      { id: 'checks', label: t('shell.workspace.object.subTabs.checks') },
      { id: 'partitions', label: t('shell.workspace.object.subTabs.partitions') }
    )
  }
  tabs.push(
    { id: 'createSql', label: t('shell.workspace.object.subTabs.createSql') },
    { id: 'alterSql', label: t('shell.workspace.object.subTabs.alterSql') }
  )
  return tabs
})

const effectiveSubTab = computed(() =>
  subTabs.value.some((tab) => tab.id === props.activeSubTab)
    ? props.activeSubTab
    : 'basic'
)

const fields = computed<readonly MockField[]>(() => {
  if (effectiveSubTab.value === 'basic') {
    return props.object.basic
  }
  if (effectiveSubTab.value === 'options') {
    return props.object.options
  }
  return []
})

const grid = computed<MockGrid | null>(() => {
  if (props.object.kind !== 'table') {
    return null
  }
  switch (effectiveSubTab.value) {
    case 'indexes':
      return props.object.indexes
    case 'foreignKeys':
      return props.object.foreignKeys
    case 'checks':
      return props.object.checks
    case 'partitions':
      return props.object.partitions
    default:
      return null
  }
})

const code = computed(() =>
  effectiveSubTab.value === 'alterSql'
    ? { value: props.object.alterSql, labelKey: 'shell.workspace.object.alterCodeLabel', testId: 'object-alter-code' }
    : { value: props.object.createSql, labelKey: 'shell.workspace.object.createCodeLabel', testId: 'object-create-code' }
)

const canOpenData = computed(() => props.object.kind !== 'event')

function openData(): void {
  if (props.object.kind === 'event') {
    return
  }
  emit('openData', {
    kind: 'data',
    database: props.object.database,
    objectKind: props.object.kind,
    object: props.object.name
  })
}
</script>

<template>
  <section
    class="object-view"
    :aria-label="t(titleKey, { name: object.name })"
  >
    <header class="object-view__header">
      <h2 class="object-view__title">
        {{ t(titleKey, { name: object.name }) }}
      </h2>
      <button
        v-if="canOpenData"
        type="button"
        class="object-view__open-data"
        @click="openData"
      >
        {{ t('shell.workspace.openData') }}
      </button>
      <span class="object-view__notice">{{ t('shell.workspace.demoNotice') }}</span>
    </header>

    <AppTabStrip
      :tabs="subTabs"
      :active-id="effectiveSubTab"
      :label="t('shell.workspace.sectionsLabel')"
      variant="secondary"
      @select="emit('update:activeSubTab', $event)"
    />

    <div class="object-view__body">
      <div
        v-if="effectiveSubTab === 'basic' || effectiveSubTab === 'options'"
        class="object-view__fields"
      >
        <dl class="object-view__list">
          <div
            v-for="field in fields"
            :key="field.labelKey"
            class="object-view__field"
          >
            <dt>{{ t(field.labelKey) }}</dt>
            <dd>{{ formatFieldValue(field, locale, translate) }}</dd>
          </div>
        </dl>
      </div>

      <MetadataGrid
        v-else-if="grid !== null"
        class="object-view__grid"
        :grid="grid"
        :theme="theme"
        :locale="locale"
        :test-id="`object-grid-${effectiveSubTab}`"
      />

      <MonacoEditor
        v-else
        :key="`${object.kind}:${object.database}/${object.name}:${effectiveSubTab}`"
        class="object-view__code"
        :model-id="`${object.kind}:${object.database}/${object.name}:${effectiveSubTab}`"
        :value="code.value"
        :theme="theme"
        :locale="locale"
        read-only
        :aria-label="t(code.labelKey, { name: object.name })"
        :test-id="code.testId"
      />
    </div>
  </section>
</template>

<style scoped>
.object-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.object-view__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 8px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--chrome-bg);
}

.object-view__title {
  margin: 0;
  font-size: var(--font-size-ui);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.object-view__open-data {
  flex: none;
  height: 18px;
  padding: 0 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 11px;
  line-height: 1;
  cursor: default;
}

.object-view__open-data:hover {
  background: var(--hover);
}

.object-view__open-data:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.object-view__notice {
  margin-left: auto;
  padding: 0 5px;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 10px;
  line-height: 15px;
  white-space: nowrap;
}

.object-view__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.object-view__fields {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 8px;
}

.object-view__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0 16px;
  margin: 0;
}

.object-view__field {
  display: grid;
  grid-template-columns: minmax(90px, 38%) 1fr;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid var(--border-soft);
  font-size: 11px;
}

.object-view__field dt {
  color: var(--text-muted);
}

.object-view__field dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.object-view__grid,
.object-view__code {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
</style>
