import { createApp } from 'vue'

import {
  DEFAULT_PREFERENCES,
  EMPTY_TABS,
  type StartupState
} from '../../domain/persistence/types'
import { detectLocale, i18n, setLocale } from './i18n'
import './styles/base.css'
import App from './ui/App.vue'

function detectedLocaleStartup(): StartupState {
  const languages =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  return {
    dataDirectory: '',
    preferences: { ...DEFAULT_PREFERENCES, locale: detectLocale(languages) },
    tabs: EMPTY_TABS,
    warnings: []
  }
}

/**
 * Preferences and tabs are read before the first mount so the stored theme and
 * language are applied without a flash and restored tabs appear immediately.
 */
async function loadStartup(): Promise<StartupState> {
  try {
    return await window.seshat.startup()
  } catch {
    // The preload is always present in the packaged app; this keeps the shell
    // usable with detected defaults if the startup call fails.
    return detectedLocaleStartup()
  }
}

async function bootstrap(): Promise<void> {
  const startup = await loadStartup()
  setLocale(startup.preferences.locale)
  createApp(App, { startup }).use(i18n).mount('#app')
}

void bootstrap()
