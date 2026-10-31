import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import { applyTheme, resolveTheme, type ResolvedTheme, type ThemePreference } from './theme'

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export interface ThemeControllerOptions {
  initialPreference?: ThemePreference
  root?: HTMLElement
  /** Called after the preference changes, so persistence can be wired in S06. */
  onChange?: (preference: ThemePreference) => void
}

export interface ThemeController {
  readonly preference: Ref<ThemePreference>
  readonly resolved: ComputedRef<ResolvedTheme>
  setPreference: (preference: ThemePreference) => void
  dispose: () => void
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches
}

/**
 * Applies the theme on creation and follows the operating system while the
 * preference is "system". The caller owns the returned controller's lifetime.
 */
export function createThemeController(options: ThemeControllerOptions = {}): ThemeController {
  const root = options.root ?? document.documentElement
  const preference = ref<ThemePreference>(options.initialPreference ?? 'system')
  const prefersDark = ref(systemPrefersDark())

  const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_MEDIA_QUERY) : null
  const onMediaChange = (event: MediaQueryListEvent): void => {
    prefersDark.value = event.matches
  }
  media?.addEventListener('change', onMediaChange)

  const resolved = computed(() => resolveTheme(preference.value, prefersDark.value))

  watch(resolved, (theme) => applyTheme(theme, root), { immediate: true })

  function setPreference(next: ThemePreference): void {
    if (preference.value === next) {
      return
    }
    preference.value = next
    options.onChange?.(next)
  }

  function dispose(): void {
    media?.removeEventListener('change', onMediaChange)
  }

  return { preference, resolved, setPreference, dispose }
}
