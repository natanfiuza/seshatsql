<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CopyOutcome } from '../grid/copy'
import { currentLocale, setLocale, type SupportedLocale } from '../i18n'
import type { ThemePreference } from '../theme/theme'
import { createThemeController } from '../theme/useTheme'
import LabEditorPane from './lab/LabEditorPane.vue'
import LabObjectTree from './lab/LabObjectTree.vue'
import LabResultsPane from './lab/LabResultsPane.vue'
import LabSqlLog from './lab/LabSqlLog.vue'
import { SAMPLE_ROWS, SAMPLE_SQL } from './lab/sample-data'
import AppMenuBar from './shell/AppMenuBar.vue'
import AppSplit from './shell/AppSplit.vue'
import AppStatusBar from './shell/AppStatusBar.vue'
import AppToolbar from './shell/AppToolbar.vue'

// Provisional main screen: the real workspace replaces it in T07/T09.
const COPY_NOTICE_MS = 2500

const { t } = useI18n()

const theme = createThemeController()
let copyTimer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  theme.dispose()
  if (copyTimer !== null) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})

const locale = ref<SupportedLocale>(currentLocale())
const sql = ref(SAMPLE_SQL)
const copyStatus = ref<'success' | 'failure' | null>(null)

const statusDetail = computed(() => {
  if (copyStatus.value === 'success') {
    return t('shell.copy.success')
  }
  if (copyStatus.value === 'failure') {
    return t('shell.copy.failure')
  }
  return t('shell.status.rows', { count: SAMPLE_ROWS.length })
})

function onThemeChange(value: ThemePreference): void {
  theme.setPreference(value)
}

function onLocaleChange(value: SupportedLocale): void {
  locale.value = value
  setLocale(value)
}

function onCopy(outcome: CopyOutcome): void {
  if (copyTimer !== null) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
  if (outcome.copied) {
    copyStatus.value = 'success'
  } else if (outcome.reason === 'clipboard-error') {
    copyStatus.value = 'failure'
  } else {
    copyStatus.value = null
    return
  }
  // The notice replaces the row count only briefly, then the normal status returns.
  copyTimer = setTimeout(() => {
    copyStatus.value = null
    copyTimer = null
  }, COPY_NOTICE_MS)
}
</script>

<template>
  <main class="lab">
    <h1 class="sr-only">
      {{ t('app.name') }}
    </h1>

    <AppMenuBar />

    <AppToolbar
      :theme="theme.preference.value"
      :locale="locale"
      @update:theme="onThemeChange"
      @update:locale="onLocaleChange"
    />

    <div class="lab__body">
      <AppSplit
        direction="vertical"
        :size="270"
        :min-start="180"
        :min-end="420"
        :label="t('shell.split.tree')"
      >
        <template #start>
          <LabObjectTree />
        </template>

        <template #end>
          <AppSplit
            direction="horizontal"
            :size="100"
            :min-start="40"
            :min-end="180"
            :label="t('shell.split.editor')"
          >
            <template #start>
              <LabEditorPane
                :sql="sql"
                :theme="theme.resolved.value"
                :locale="locale"
                @change="sql = $event"
              />
            </template>

            <template #end>
              <AppSplit
                direction="horizontal"
                pane="end"
                :size="80"
                :min-start="120"
                :min-end="40"
                :label="t('shell.split.log')"
              >
                <template #start>
                  <LabResultsPane
                    :theme="theme.resolved.value"
                    :locale="locale"
                    @copy="onCopy"
                  />
                </template>

                <template #end>
                  <LabSqlLog />
                </template>
              </AppSplit>
            </template>
          </AppSplit>
        </template>
      </AppSplit>
    </div>

    <AppStatusBar :detail="statusDetail" />
  </main>
</template>

<style scoped>
.lab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--chrome-bg);
}

.lab__body {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
</style>
