import { describe, expect, it } from 'vitest'

import enUS from '../../src/renderer/src/i18n/locales/en-US'
import es from '../../src/renderer/src/i18n/locales/es'
import fr from '../../src/renderer/src/i18n/locales/fr'
import ptBR from '../../src/renderer/src/i18n/locales/pt-BR'
import ptPT from '../../src/renderer/src/i18n/locales/pt-PT'

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`
    return typeof child === 'object' && child !== null ? keysOf(child, path) : [path]
  })
}

const reference = keysOf(enUS).sort()

describe('locale catalogs', () => {
  const catalogs = { 'pt-BR': ptBR, 'pt-PT': ptPT, fr, es }

  for (const [locale, catalog] of Object.entries(catalogs)) {
    it(`${locale} has the same keys as en-US`, () => {
      expect(keysOf(catalog).sort()).toEqual(reference)
    })
  }

  it('does not leave any message empty', () => {
    for (const [locale, catalog] of Object.entries({ 'en-US': enUS, ...catalogs })) {
      for (const key of keysOf(catalog)) {
        const parts = key.split('.')
        let node: unknown = catalog
        for (const part of parts) {
          node = (node as Record<string, unknown>)[part]
        }
        expect(typeof node, `${locale}:${key}`).toBe('string')
        expect((node as string).trim(), `${locale}:${key}`).not.toBe('')
      }
    }
  })
})
