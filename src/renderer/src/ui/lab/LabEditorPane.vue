<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { PersistedCursor, PersistedSelection } from '../../../../domain/persistence/types'
import MonacoEditor from '../../editor/MonacoEditor.vue'
import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import AppTabStrip from '../shell/AppTabStrip.vue'
import LabHelpersPanel from './LabHelpersPanel.vue'

interface EditorTab {
  readonly id: string
  readonly label: string
}

defineProps<{
  tabs: readonly EditorTab[]
  activeId: string
  sql: string
  theme: ResolvedTheme
  locale: SupportedLocale
  cursor: PersistedCursor | null
  selection: PersistedSelection | null
}>()

const emit = defineEmits<{
  change: [value: string]
  select: [id: string]
  view: [cursor: PersistedCursor, selection: PersistedSelection | null]
}>()

const { t } = useI18n()
</script>

<template>
  <section
    class="editor-pane"
    :aria-label="t('shell.editor.label')"
  >
    <AppTabStrip
      :tabs="tabs"
      :active-id="activeId"
      :label="t('shell.editor.label')"
      @select="emit('select', $event)"
    />

    <div class="editor-pane__body">
      <MonacoEditor
        :key="activeId"
        class="editor-pane__editor"
        :model-id="activeId"
        :value="sql"
        :theme="theme"
        :locale="locale"
        :cursor="cursor"
        :selection="selection"
        @change="emit('change', $event)"
        @view="(cursor, selection) => emit('view', cursor, selection)"
      />
      <LabHelpersPanel class="editor-pane__helpers" />
    </div>
  </section>
</template>

<style scoped>
.editor-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--editor-bg);
}

.editor-pane__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.editor-pane__editor {
  flex: 1 1 auto;
  min-width: 0;
}

.editor-pane__helpers {
  flex: 0 0 200px;
  min-width: 0;
  border-left: 1px solid var(--border-soft);
}
</style>
