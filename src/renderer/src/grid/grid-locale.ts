import type { LocaleText } from 'ag-grid-community'

import { i18n } from '../i18n'

/**
 * AG Grid ships no locale files, so only the keys this UI actually reaches are
 * translated. Everything else keeps the built-in English fallback.
 */
export const GRID_LOCALE_KEYS = ['noRowsToShow', 'ariaSortableColumn'] as const

export type GridLocaleKey = (typeof GRID_LOCALE_KEYS)[number]

export function createGridLocaleText(): LocaleText {
  const text: LocaleText = {}
  for (const key of GRID_LOCALE_KEYS) {
    text[key] = i18n.global.t(`grid.${key}`)
  }
  return text
}
