import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectLocale,
  isSupportedLocale,
  matchLocale,
  monacoNlsLocale
} from '../../src/renderer/src/i18n'

describe('matchLocale', () => {
  it('maps the supported regional tags', () => {
    expect(matchLocale('pt-BR')).toBe('pt-BR')
    expect(matchLocale('pt-PT')).toBe('pt-PT')
    expect(matchLocale('en-US')).toBe('en-US')
  })

  it('normalizes case and underscores', () => {
    expect(matchLocale('PT_br')).toBe('pt-BR')
    expect(matchLocale('pt-pt')).toBe('pt-PT')
    expect(matchLocale('fr-CA')).toBe('fr')
  })

  it('maps a bare Portuguese tag to pt-BR', () => {
    expect(matchLocale('pt')).toBe('pt-BR')
  })

  it('falls back to the base language for other regions', () => {
    expect(matchLocale('es-AR')).toBe('es')
    expect(matchLocale('en-GB')).toBe('en-US')
  })

  it('returns null for unsupported languages', () => {
    expect(matchLocale('de-DE')).toBeNull()
    expect(matchLocale('')).toBeNull()
  })
})

describe('detectLocale', () => {
  it('uses the first supported language', () => {
    expect(detectLocale(['de-DE', 'pt-PT', 'en-US'])).toBe('pt-PT')
  })

  it('falls back to en-US when nothing is supported', () => {
    expect(detectLocale(['de-DE', 'ja-JP'])).toBe(DEFAULT_LOCALE)
    expect(detectLocale([])).toBe(DEFAULT_LOCALE)
  })
})

describe('isSupportedLocale', () => {
  it('accepts only the five catalogues', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(isSupportedLocale(locale)).toBe(true)
    }
    expect(isSupportedLocale('de-DE')).toBe(false)
    expect(isSupportedLocale(undefined)).toBe(false)
  })
})

describe('monacoNlsLocale', () => {
  it('returns the two translated Monaco bundles', () => {
    expect(monacoNlsLocale('es')).toBe('es')
    expect(monacoNlsLocale('fr')).toBe('fr')
  })

  it('keeps English for en-US, pt-BR and pt-PT', () => {
    expect(monacoNlsLocale('en-US')).toBeNull()
    expect(monacoNlsLocale('pt-BR')).toBeNull()
    expect(monacoNlsLocale('pt-PT')).toBeNull()
  })
})
