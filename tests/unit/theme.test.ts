// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { applyTheme, isThemePreference, resolveTheme } from '../../src/renderer/src/theme/theme'

describe('resolveTheme', () => {
  it('follows the system preference while the user chose system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('ignores the system preference for explicit choices', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('isThemePreference', () => {
  it('accepts only the three documented values', () => {
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})

describe('applyTheme', () => {
  it('writes the theme attribute and the native color scheme', () => {
    const root = document.createElement('div')

    applyTheme('dark', root)
    expect(root.dataset.theme).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')

    applyTheme('light', root)
    expect(root.dataset.theme).toBe('light')
    expect(root.style.colorScheme).toBe('light')
  })
})
