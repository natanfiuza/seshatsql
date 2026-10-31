<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MonacoEditor from '../../editor/MonacoEditor.vue'
import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import AppTabStrip from '../shell/AppTabStrip.vue'
import LabHelpersPanel from './LabHelpersPanel.vue'

defineProps<{
  sql: string
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const emit = defineEmits<{ change: [value: string] }>()

const { t } = useI18n()

const tabs = computed(() => [{ id: 'query-1', label: t('shell.tabs.queryOne') }])
</script>

<template>
  <section
    class="editor-pane"
    :aria-label="t('shell.editor.label')"
  >
    <AppTabStrip
      :tabs="tabs"
      active-id="query-1"
      :label="t('shell.editor.label')"
    />

    <div class="editor-pane__body">
      <MonacoEditor
        class="editor-pane__editor"
        model-id="s05-lab"
        :value="sql"
        :theme="theme"
        :locale="locale"
        @change="emit('change', $event)"
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
