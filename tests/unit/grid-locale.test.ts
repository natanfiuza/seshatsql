import { afterEach, describe, expect, it } from 'vitest'

import { GRID_LOCALE_KEYS, createGridLocaleText } from '../../src/renderer/src/grid/grid-locale'
import { SUPPORTED_LOCALES, i18n, setLocale } from '../../src/renderer/src/i18n'

afterEach(() => {
  setLocale('en-US')
})

describe('createGridLocaleText', () => {
  it('translates every used key in every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      setLocale(locale)
      const text = createGridLocaleText()

      for (const key of GRID_LOCALE_KEYS) {
        expect(text[key], `${locale}:${key}`).toBe(i18n.global.t(`grid.${key}`))
        expect(text[key], `${locale}:${key}`).not.toBe('')
      }
    }
  })

  it('actually translates instead of reusing the en-US text', () => {
    setLocale('en-US')
    const english = createGridLocaleText()
    setLocale('pt-BR')
    const portuguese = createGridLocaleText()

    for (const key of GRID_LOCALE_KEYS) {
      expect(portuguese[key], `pt-BR:${key}`).not.toBe(english[key])
    }
  })
})
