import { createI18n } from 'vue-i18n'

import enUS from './locales/en-US'
import es from './locales/es'
import fr from './locales/fr'
import ptBR from './locales/pt-BR'
import ptPT from './locales/pt-PT'

// R22: en-US padrão, pt-BR, pt-PT, fr, es.
export const SUPPORTED_LOCALES = ['en-US', 'pt-BR', 'pt-PT', 'fr', 'es'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'en-US': enUS,
    'pt-BR': ptBR,
    'pt-PT': ptPT,
    fr,
    es
  }
})
