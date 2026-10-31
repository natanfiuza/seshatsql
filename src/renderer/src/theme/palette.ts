import type { ResolvedTheme } from './theme'

/**
 * Concrete colors for the desktop shell. Grid and chrome share this table so a
 * theme change cannot leave the grid on a stale palette. CSS mirrors these
 * values in styles/tokens.css; tests/unit/palette.test.ts keeps them in sync.
 */
export interface Palette {
  chromeBg: string
  surface: string
  surfaceAlt: string
  border: string
  borderSoft: string
  text: string
  textMuted: string
  accent: string
  accentText: string
  danger: string
  focus: string
  hover: string
  selectedBg: string
  selectedText: string
  gridHeaderBg: string
  gridLine: string
  gridRowNumber: string
  gutterBg: string
  splitter: string
  editorBg: string
}

export const PALETTES: Record<ResolvedTheme, Palette> = {
  light: {
    chromeBg: '#f0f0f0',
    surface: '#ffffff',
    surfaceAlt: '#f7f7f7',
    border: '#a0a0a0',
    borderSoft: '#d7d7d7',
    text: '#1a1a1a',
    textMuted: '#6b6b6b',
    accent: '#0078d7',
    accentText: '#ffffff',
    danger: '#b3261e',
    focus: '#0078d7',
    hover: '#dcecfa',
    selectedBg: '#0078d7',
    selectedText: '#ffffff',
    gridHeaderBg: '#f0f0f0',
    gridLine: '#d7d7d7',
    gridRowNumber: '#6b6b6b',
    gutterBg: '#f5f5f5',
    splitter: '#f0f0f0',
    editorBg: '#ffffff'
  },
  dark: {
    chromeBg: '#202020',
    surface: '#1e1e1e',
    surfaceAlt: '#262626',
    border: '#4a4a4a',
    borderSoft: '#333333',
    text: '#e8e8e8',
    textMuted: '#9a9a9a',
    accent: '#2563eb',
    accentText: '#ffffff',
    danger: '#ff8a80',
    focus: '#6d9bff',
    hover: '#333a44',
    selectedBg: '#264f78',
    selectedText: '#ffffff',
    gridHeaderBg: '#2d2d2d',
    gridLine: '#3c3c3c',
    gridRowNumber: '#9a9a9a',
    gutterBg: '#252526',
    splitter: '#2a2a2a',
    editorBg: '#1e1e1e'
  }
}

/** CSS custom property that mirrors each palette entry in tokens.css. */
export const PALETTE_TOKENS: Record<keyof Palette, string> = {
  chromeBg: '--chrome-bg',
  surface: '--surface',
  surfaceAlt: '--surface-alt',
  border: '--border',
  borderSoft: '--border-soft',
  text: '--text',
  textMuted: '--text-muted',
  accent: '--accent',
  accentText: '--accent-text',
  danger: '--danger',
  focus: '--focus',
  hover: '--hover',
  selectedBg: '--selected-bg',
  selectedText: '--selected-text',
  gridHeaderBg: '--grid-header-bg',
  gridLine: '--grid-line',
  gridRowNumber: '--grid-row-number',
  gutterBg: '--gutter-bg',
  splitter: '--splitter',
  editorBg: '--editor-bg'
}
