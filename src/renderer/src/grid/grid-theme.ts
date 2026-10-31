import { themeQuartz } from 'ag-grid-community'

import type { ResolvedTheme } from '../theme/theme'

/**
 * AG Grid Theming API needs concrete colors; these mirror styles/tokens.css.
 * Keep both lists in sync when a token changes.
 */
const PALETTES = {
  light: {
    accentColor: '#2f6feb',
    backgroundColor: '#ffffff',
    foregroundColor: '#1c1e24',
    borderColor: '#d7d9e0',
    headerBackgroundColor: '#f1f2f5',
    headerTextColor: '#1c1e24',
    oddRowBackgroundColor: '#fafafc',
    selectedRowBackgroundColor: '#dbe6ff',
    browserColorScheme: 'light'
  },
  dark: {
    accentColor: '#6d9bff',
    backgroundColor: '#1e2128',
    foregroundColor: '#e8eaf0',
    borderColor: '#353a45',
    headerBackgroundColor: '#242833',
    headerTextColor: '#e8eaf0',
    oddRowBackgroundColor: '#21252d',
    selectedRowBackgroundColor: '#2b3d63',
    browserColorScheme: 'dark'
  }
} as const

export function createGridTheme(theme: ResolvedTheme) {
  return themeQuartz.withParams({
    ...PALETTES[theme],
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 13,
    wrapperBorderRadius: 6
  })
}
