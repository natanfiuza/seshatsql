/**
 * Theme preference and resolution rules.
 * Pure module: no Vue and no DOM until applyTheme is called.
 */

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export type ResolvedTheme = 'light' | 'dark'

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
}

/** System preference only applies when the user chose "system". */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light'
  }
  return preference
}

/** Writes the resolved theme to the root element and keeps native controls in sync. */
export function applyTheme(theme: ResolvedTheme, root: HTMLElement): void {
  root.dataset['theme'] = theme
  root.style.colorScheme = theme
}
