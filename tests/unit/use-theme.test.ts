// @vitest-environment jsdom
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createThemeController } from '../../src/renderer/src/theme/useTheme'

interface MediaStub {
  emit: (matches: boolean) => void
  listenerCount: () => number
}

function stubMatchMedia(matches: boolean): MediaStub {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const query = {
    matches,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void): void => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void): void => {
      listeners.delete(listener)
    }
  }

  vi.stubGlobal('matchMedia', () => query)

  return {
    emit: (next) => {
      query.matches = next
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent)
      }
    },
    listenerCount: () => listeners.size
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createThemeController', () => {
  it('resolves the system preference and applies it to the document', () => {
    stubMatchMedia(true)
    const controller = createThemeController()

    expect(controller.resolved.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    controller.dispose()
  })

  it('follows system changes only while the preference is system', async () => {
    const media = stubMatchMedia(false)
    const controller = createThemeController()

    media.emit(true)
    await nextTick()
    expect(controller.resolved.value).toBe('dark')

    controller.setPreference('light')
    media.emit(true)
    await nextTick()
    expect(controller.resolved.value).toBe('light')

    controller.dispose()
  })

  it('notifies the preference change and stops listening when disposed', () => {
    const media = stubMatchMedia(false)
    const onChange = vi.fn()
    const controller = createThemeController({ onChange })

    controller.setPreference('dark')
    controller.setPreference('dark')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('dark')

    controller.dispose()
    expect(media.listenerCount()).toBe(0)
  })
})
