<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CopyOutcome } from '../../grid/copy'
import ResultGrid from '../../grid/ResultGrid.vue'
import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import AppTabStrip from '../shell/AppTabStrip.vue'
import { SAMPLE_COLUMNS, SAMPLE_ROWS } from './sample-data'

defineProps<{
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const emit = defineEmits<{ copy: [outcome: CopyOutcome] }>()

const { t } = useI18n()

const tabs = computed(() => [{ id: 'result-1', label: t('shell.tabs.resultOne') }])
</script>

<template>
  <section
    class="results-pane"
    :aria-label="t('shell.results.label')"
  >
    <AppTabStrip
      :tabs="tabs"
      active-id="result-1"
      :label="t('shell.results.label')"
    />

    <div
      class="results-pane__grid"
      :title="t('shell.results.copyHint')"
    >
      <ResultGrid
        :columns="SAMPLE_COLUMNS"
        :rows="SAMPLE_ROWS"
        :theme="theme"
        :locale="locale"
        @copy="emit('copy', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.results-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.results-pane__grid {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
