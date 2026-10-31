<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type SupportedLocale
} from '../../i18n'
import { isThemePreference, type ThemePreference } from '../../theme/theme'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

interface ToolAction {
  readonly icon: IconName
  readonly labelKey: string
}

const props = defineProps<{
  theme: ThemePreference
  locale: SupportedLocale
}>()

const emit = defineEmits<{
  'update:theme': [theme: ThemePreference]
  'update:locale': [locale: SupportedLocale]
}>()

const { t } = useI18n()

const TOOL_GROUPS: ReadonlyArray<ReadonlyArray<ToolAction>> = [
  [
    { icon: 'newQuery', labelKey: 'shell.toolbar.newQuery' },
    { icon: 'open', labelKey: 'shell.toolbar.open' },
    { icon: 'save', labelKey: 'shell.toolbar.save' }
  ],
  [
    { icon: 'execute', labelKey: 'shell.toolbar.execute' },
    { icon: 'stop', labelKey: 'shell.toolbar.stop' }
  ],
  [{ icon: 'refresh', labelKey: 'shell.toolbar.refresh' }],
  [
    { icon: 'filter', labelKey: 'shell.toolbar.filter' },
    { icon: 'search', labelKey: 'shell.toolbar.search' }
  ],
  [{ icon: 'settings', labelKey: 'shell.toolbar.settings' }],
  [{ icon: 'disconnected', labelKey: 'shell.toolbar.disconnect' }]
]

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; labelKey: string }> = [
  { value: 'system', labelKey: 'shell.theme.system' },
  { value: 'light', labelKey: 'shell.theme.light' },
  { value: 'dark', labelKey: 'shell.theme.dark' }
]

const LOCALE_LABEL_KEYS: Record<SupportedLocale, string> = {
  'en-US': 'shell.locale.enUS',
  'pt-BR': 'shell.locale.ptBR',
  'pt-PT': 'shell.locale.ptPT',
  fr: 'shell.locale.fr',
  es: 'shell.locale.es'
}

function disabledTitle(labelKey: string): string {
  return `${t(labelKey)} — ${t('shell.disabledHint')}`
}

function onThemeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isThemePreference(value)) {
    emit('update:theme', value)
  }
}

function onLocaleChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isSupportedLocale(value)) {
    emit('update:locale', value)
  }
}
</script>

<template>
  <div
    class="toolbar"
    role="toolbar"
    :aria-label="t('shell.toolbar.label')"
  >
    <div
      v-for="(group, groupIndex) in TOOL_GROUPS"
      :key="groupIndex"
      class="toolbar__group"
    >
      <span
        v-if="groupIndex > 0"
        class="toolbar__separator"
        aria-hidden="true"
      />
      <button
        v-for="action in group"
        :key="action.icon"
        type="button"
        class="toolbar__button"
        aria-disabled="true"
        :title="disabledTitle(action.labelKey)"
        @click.prevent
      >
        <AppIcon :name="action.icon" />
      </button>
    </div>

    <span class="toolbar__spacer" />

    <label class="toolbar__combo">
      <AppIcon name="theme" />
      <span class="sr-only">{{ t('shell.toolbar.themeLabel') }}</span>
      <select
        data-testid="theme-select"
        class="toolbar__select"
        :value="props.theme"
        :title="t('shell.toolbar.themeLabel')"
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

    <label class="toolbar__combo">
      <span class="sr-only">{{ t('shell.toolbar.localeLabel') }}</span>
      <select
        data-testid="locale-select"
        class="toolbar__select toolbar__select--locale"
        :value="props.locale"
        :title="t('shell.toolbar.localeHint')"
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
</template>

<style scoped>
.toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  height: var(--toolbar-h);
  padding: 0 4px;
  background: var(--chrome-bg);
  border-bottom: 1px solid var(--border-soft);
  user-select: none;
}

.toolbar__group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.toolbar__separator {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: var(--border-soft);
}

.toolbar__button {
  display: grid;
  place-items: center;
  width: var(--control-h);
  height: var(--control-h);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: default;
}

.toolbar__button[aria-disabled='true'] {
  color: var(--text-muted);
}

.toolbar__button:hover {
  background: var(--hover);
}

.toolbar__button:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.toolbar__spacer {
  flex: 1 1 auto;
  min-width: 4px;
}

.toolbar__combo {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.toolbar__select {
  height: 20px;
  max-width: 96px;
  padding: 0 2px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface);
  color: var(--text);
  font-size: 11px;
}

.toolbar__select--locale {
  max-width: 150px;
}

.toolbar__select:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}
</style>
