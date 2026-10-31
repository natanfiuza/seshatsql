<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import MonacoEditor from '../editor/MonacoEditor.vue'
import ResultGrid from '../grid/ResultGrid.vue'
import type { CopyOutcome } from '../grid/copy'
import type { GridColumnDescriptor } from '../grid/tsv'
import {
  SUPPORTED_LOCALES,
  currentLocale,
  isSupportedLocale,
  setLocale,
  type SupportedLocale
} from '../i18n'
import { isThemePreference, type ThemePreference } from '../theme/theme'
import { createThemeController } from '../theme/useTheme'

const { t } = useI18n()

// Provisional main screen: the real workspace replaces it in T07/T09.
const theme = createThemeController()
onBeforeUnmount(theme.dispose)

const locale = ref<SupportedLocale>(currentLocale())

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; labelKey: string }> = [
  { value: 'system', labelKey: 'lab.themeSystem' },
  { value: 'light', labelKey: 'lab.themeLight' },
  { value: 'dark', labelKey: 'lab.themeDark' }
]

const LOCALE_LABEL_KEYS: Record<SupportedLocale, string> = {
  'en-US': 'lab.localeNameEnUS',
  'pt-BR': 'lab.localeNamePtBR',
  'pt-PT': 'lab.localeNamePtPT',
  fr: 'lab.localeNameFr',
  es: 'lab.localeNameEs'
}

const sql = ref(`SELECT
  c.id,
  c.full_name,
  c.status,
  c.notes,
  c.amount
FROM customers AS c
WHERE c.status = 'active'
ORDER BY c.full_name
LIMIT 100;
`)

// Result-set names are data, not interface text, so they are not translated.
const columns: readonly GridColumnDescriptor[] = [
  { field: 'id', header: 'id' },
  { field: 'full_name', header: 'full_name' },
  { field: 'status', header: 'status' },
  { field: 'notes', header: 'notes' },
  { field: 'amount', header: 'amount' }
]

const rows: readonly Record<string, unknown>[] = [
  { id: 1, full_name: 'Ana Silva', status: 'active', notes: null, amount: 1250.5 },
  { id: 2, full_name: '佐藤 健', status: 'active', notes: 'Unicode: ação, ñ, 日本語', amount: 980 },
  { id: 3, full_name: 'Zoë Ångström', status: 'paused', notes: 'Second line\nwith a break', amount: 0 },
  {
    id: 4,
    full_name: 'Long text sample',
    status: 'active',
    notes: `${'x'.repeat(160)} end`,
    amount: 42
  }
]

const copyStatus = ref<'success' | 'failure' | null>(null)

function onThemeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isThemePreference(value)) {
    theme.setPreference(value)
  }
}

function onLocaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (!isSupportedLocale(value)) {
    return
  }
  locale.value = value
  setLocale(value)
}

function onCopy(outcome: CopyOutcome): void {
  if (outcome.copied) {
    copyStatus.value = 'success'
  } else if (outcome.reason === 'clipboard-error') {
    copyStatus.value = 'failure'
  } else {
    copyStatus.value = null
  }
}
</script>

<template>
  <main class="lab">
    <header class="lab__header">
      <div>
        <h1 class="lab__title">
          {{ t('app.name') }}
        </h1>
        <p class="lab__tagline">
          {{ t('app.tagline') }}
        </p>
      </div>

      <div class="lab__controls">
        <label
          class="lab__control"
          for="lab-theme"
        >
          <span>{{ t('lab.themeLabel') }}</span>
          <select
            id="lab-theme"
            data-testid="theme-select"
            :value="theme.preference.value"
            @change="onThemeChange"
          >
            <option
              v-for="option in THEME_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ t(option.labelKey) }}
            </option>
          </select>
        </label>

        <label
          class="lab__control"
          for="lab-language"
        >
          <span>{{ t('lab.languageLabel') }}</span>
          <select
            id="lab-language"
            data-testid="locale-select"
            :value="locale"
            @change="onLocaleChange"
          >
            <option
              v-for="supported in SUPPORTED_LOCALES"
              :key="supported"
              :value="supported"
            >
              {{ t(LOCALE_LABEL_KEYS[supported]) }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <section
      class="lab__intro"
      aria-labelledby="lab-title"
    >
      <h2
        id="lab-title"
        class="lab__section-title"
      >
        {{ t('lab.title') }}
      </h2>
      <p class="lab__text">
        {{ t('lab.intro') }}
      </p>
      <p class="lab__notice">
        {{ t('lab.editorLanguageNotice') }}
      </p>
    </section>

    <div class="lab__panels">
      <section
        class="lab__panel"
        aria-labelledby="lab-editor-title"
      >
        <h3
          id="lab-editor-title"
          class="lab__section-title"
        >
          {{ t('lab.editorTitle') }}
        </h3>
        <p class="lab__hint">
          {{ t('lab.editorHint') }}
        </p>
        <MonacoEditor
          class="lab__editor"
          model-id="s05-lab"
          :value="sql"
          :theme="theme.resolved.value"
          :locale="locale"
          @change="sql = $event"
        />
      </section>

      <section
        class="lab__panel"
        aria-labelledby="lab-grid-title"
      >
        <h3
          id="lab-grid-title"
          class="lab__section-title"
        >
          {{ t('lab.gridTitle') }}
        </h3>
        <p class="lab__hint">
          {{ t('lab.gridHint') }}
        </p>
        <p class="lab__hint">
          {{ t('lab.copyHint') }}
        </p>
        <ResultGrid
          class="lab__grid"
          :columns="columns"
          :rows="rows"
          :theme="theme.resolved.value"
          :locale="locale"
          @copy="onCopy"
        />
        <p
          class="lab__status"
          role="status"
          aria-live="polite"
        >
          <template v-if="copyStatus === 'success'">
            {{ t('lab.copySuccess') }}
          </template>
          <template v-else-if="copyStatus === 'failure'">
            {{ t('lab.copyFailure') }}
          </template>
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lab {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: var(--space-4);
  height: 100%;
  padding: var(--space-4);
  overflow: hidden;
}

.lab__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.lab__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.lab__tagline {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
}

.lab__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.lab__control {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.lab__control select {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.lab__control select:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.lab__intro {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.lab__section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.lab__text,
.lab__hint,
.lab__notice {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.lab__notice {
  color: var(--color-text);
}

.lab__panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
  min-height: 0;
}

.lab__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.lab__editor,
.lab__grid {
  flex: 1;
  min-height: 0;
  margin-top: var(--space-2);
}

.lab__status {
  min-height: 1.25rem;
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

@media (max-width: 900px) {
  .lab {
    grid-template-rows: auto auto auto;
    overflow: auto;
  }

  .lab__panels {
    grid-template-columns: minmax(0, 1fr);
  }

  .lab__editor,
  .lab__grid {
    height: 20rem;
    flex: none;
  }
}
</style>
