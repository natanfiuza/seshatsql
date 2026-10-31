import { createI18n } from 'vue-i18n'

import enUS from './locales/en-US'
import es from './locales/es'
import fr from './locales/fr'
import ptBR from './locales/pt-BR'
import ptPT from './locales/pt-PT'

// R22: en-US default, pt-BR, pt-PT, fr, es.
export const SUPPORTED_LOCALES = ['en-US', 'pt-BR', 'pt-PT', 'fr', 'es'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Maps a BCP 47 tag to one supported locale.
 * Bare "pt" maps to pt-BR; any other region falls back to its base language.
 */
export function matchLocale(tag: string): SupportedLocale | null {
  const normalized = tag.replace(/_/g, '-').toLowerCase()

  if (normalized === 'pt-br') {
    return 'pt-BR'
  }
  if (normalized === 'pt-pt') {
    return 'pt-PT'
  }

  const base = normalized.split('-')[0]
  switch (base) {
    case 'pt':
      return 'pt-BR'
    case 'fr':
      return 'fr'
    case 'es':
      return 'es'
    case 'en':
      return 'en-US'
    default:
      return null
  }
}

/** First supported language advertised by the system, otherwise en-US. */
export function detectLocale(languages: readonly string[]): SupportedLocale {
  for (const tag of languages) {
    const matched = matchLocale(tag)
    if (matched !== null) {
      return matched
    }
  }
  return DEFAULT_LOCALE
}

/**
 * Monaco ships translated messages for es and fr only. The pt-br bundle exists
 * but every entry is null, and there is no pt-pt bundle, so both remain English.
 */
export function monacoNlsLocale(locale: SupportedLocale): 'es' | 'fr' | null {
  if (locale === 'es' || locale === 'fr') {
    return locale
  }
  return null
}

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

export function currentLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}
