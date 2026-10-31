// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the two stubs replace the real child components */
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  EMPTY_TABS,
  type PersistedTab,
  type PersistenceWarning,
  type StartupState
} from '../../src/domain/persistence/types'
import { i18n, setLocale } from '../../src/renderer/src/i18n'
import S05Lab from '../../src/renderer/src/ui/S05Lab.vue'

const labState = vi.hoisted(() => ({
  copyOutcome: 'success' as 'success' | 'failure'
}))

const apiState = vi.hoisted(() => ({
  closeListeners: [] as Array<() => void>,
  closeFailedListeners: [] as Array<(info: { reason: string }) => void>,
  tabsSaves: [] as Array<Record<string, unknown>>,
  tabFlushes: [] as Array<Record<string, unknown>>,
  preferencesSets: [] as Array<Record<string, unknown>>,
  replies: [] as Array<Record<string, unknown>>,
  saveOk: true,
  saveReason: 'io-error',
  saveThrows: false
}))

vi.mock('../../src/renderer/src/editor/MonacoEditor.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'MonacoEditorStub',
      props: {
        modelId: { type: String, required: true },
        value: { type: String, required: true },
        theme: { type: String, required: true },
        locale: { type: String, required: true },
        cursor: { type: Object, default: null },
        selection: { type: Object, default: null }
      },
      emits: ['change', 'view'],
      setup(props, { emit }) {
        return () =>
          h(
            'div',
            {
              'data-testid': 'monaco-stub',
              'data-model-id': props.modelId,
              'data-value': props.value,
              'data-theme': props.theme,
              'data-locale': props.locale,
              'data-cursor': props.cursor === null ? '' : JSON.stringify(props.cursor)
            },
            [
              h('button', {
                'data-testid': 'monaco-change',
                onClick: () => emit('change', 'SELECT 7')
              })
            ]
          )
      }
    })
  }
})

vi.mock('../../src/renderer/src/grid/ResultGrid.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'ResultGridStub',
      props: {
        columns: { type: Array, required: true },
        rows: { type: Array, required: true },
        theme: { type: String, required: true },
        locale: { type: String, required: true }
      },
      emits: ['copy'],
      setup(_props, { emit }) {
        return () =>
          h('button', {
            'data-testid': 'grid-copy',
            onClick: () => {
              emit(
                'copy',
                labState.copyOutcome === 'success'
                  ? { copied: true, mode: 'rows' }
                  : { copied: false, reason: 'clipboard-error' }
              )
            }
          })
      }
    })
  }
})

function sampleTab(overrides: Partial<PersistedTab> = {}): PersistedTab {
  return {
    id: 'query-1',
    title: 'Query 1',
    text: 'SELECT 42',
    connectionId: null,
    database: null,
    order: 0,
    cursor: null,
    selection: null,
    ...overrides
  }
}

function startupState(overrides: Partial<StartupState> = {}): StartupState {
  return {
    dataDirectory: 'C:\\temp\\seshat-data',
    preferences: { schemaVersion: 1, theme: 'system', locale: 'en-US' },
    tabs: EMPTY_TABS,
    warnings: [],
    ...overrides
  }
}

function tabsState(tabs: PersistedTab[], activeTabId: string | null = tabs[0]?.id ?? null) {
  return { schemaVersion: 1 as const, activeTabId, tabs }
}

function installApi(): void {
  const api = {
    productName: 'SeshatSQL',
    startup: vi.fn(async () => startupState()),
    preferences: {
      get: vi.fn(async () => startupState().preferences),
      set: vi.fn(async (input: Record<string, unknown>) => {
        apiState.preferencesSets.push(input)
        return apiState.saveOk ? { ok: true } : { ok: false, reason: apiState.saveReason }
      })
    },
    tabs: {
      load: vi.fn(async () => ({ tabs: EMPTY_TABS, warnings: [] })),
      save: vi.fn(async (state: Record<string, unknown>) => {
        if (apiState.saveThrows) {
          throw new Error('An object could not be cloned')
        }
        apiState.tabsSaves.push(state)
        return apiState.saveOk ? { ok: true } : { ok: false, reason: apiState.saveReason }
      }),
      flush: vi.fn(async (state: Record<string, unknown>) => {
        apiState.tabFlushes.push(state)
        return apiState.saveOk ? { ok: true } : { ok: false, reason: apiState.saveReason }
      })
    },
    connections: {
      list: vi.fn(async () => ({ profiles: [], warnings: [] })),
      save: vi.fn(),
      delete: vi.fn()
    },
    app: {
      onCloseRequested: (callback: () => void) => {
        apiState.closeListeners.push(callback)
        return () => {
          const index = apiState.closeListeners.indexOf(callback)
          if (index >= 0) {
            apiState.closeListeners.splice(index, 1)
          }
        }
      },
      onCloseFailed: (callback: (info: { reason: string }) => void) => {
        apiState.closeFailedListeners.push(callback)
        return () => {
          const index = apiState.closeFailedListeners.indexOf(callback)
          if (index >= 0) {
            apiState.closeFailedListeners.splice(index, 1)
          }
        }
      },
      replyClose: (reply: Record<string, unknown>) => {
        apiState.replies.push(reply)
      },
      requestClose: vi.fn()
    }
  }

  Object.defineProperty(window, 'seshat', { value: api, configurable: true })
}

const mounted: VueWrapper[] = []

function mountLab(state: StartupState = startupState()): VueWrapper {
  const wrapper = mount(S05Lab, {
    props: { startup: state },
    global: { plugins: [i18n] }
  })
  mounted.push(wrapper)
  return wrapper
}

async function triggerClose(): Promise<void> {
  for (const listener of apiState.closeListeners) {
    listener()
  }
  await flushPromises()
}

afterEach(() => {
  while (mounted.length > 0) {
    mounted.pop()?.unmount()
  }
  vi.useRealTimers()
})

beforeEach(() => {
  labState.copyOutcome = 'success'
  apiState.closeListeners.length = 0
  apiState.closeFailedListeners.length = 0
  apiState.tabsSaves.length = 0
  apiState.tabFlushes.length = 0
  apiState.preferencesSets.length = 0
  apiState.replies.length = 0
  apiState.saveOk = true
  apiState.saveReason = 'io-error'
  apiState.saveThrows = false
  installApi()
  setLocale('en-US')
  delete document.documentElement.dataset.theme
  document.documentElement.style.colorScheme = ''
})

describe('S05Lab', () => {
  it('renders the shell in the selected locale before any interaction', () => {
    setLocale('pt-BR')

    const wrapper = mountLab(
      startupState({
        preferences: { schemaVersion: 1, theme: 'system', locale: 'pt-BR' }
      })
    )

    expect(wrapper.get('h1').text()).toBe('SeshatSQL')
    expect(wrapper.text()).toContain('Arquivo')
    expect(wrapper.text()).toContain('Tabelas (3)')
    expect(wrapper.text()).toContain('Consulta 1')
    expect(wrapper.text()).toContain('Desconectado')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-locale')).toBe('pt-BR')
  })

  it('applies the chosen theme to the document, the editor and preferences', async () => {
    const wrapper = mountLab()
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-theme')).toBe('light')

    await wrapper.get('[data-testid="theme-select"]').setValue('dark')
    await flushPromises()

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-theme')).toBe('dark')
    expect(apiState.preferencesSets.at(-1)).toEqual({ theme: 'dark', locale: 'en-US' })
  })

  it('switches the interface language live and persists it', async () => {
    const wrapper = mountLab()

    await wrapper.get('[data-testid="locale-select"]').setValue('fr')
    await flushPromises()

    expect(wrapper.text()).toContain('Fichier')
    expect(wrapper.text()).toContain('Lignes : 4')
    expect(document.documentElement.lang).toBe('fr')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-locale')).toBe('fr')
    expect(apiState.preferencesSets.at(-1)).toEqual({ theme: 'system', locale: 'fr' })
    // The notice moved out of the page and became the combobox tooltip.
    expect(wrapper.get('[data-testid="locale-select"]').attributes('title')).toContain(
      "s'applique au prochain démarrage"
    )
  })

  it('restores the saved tab text and cursor without writing on load', async () => {
    const wrapper = mountLab(
      startupState({
        tabs: tabsState([sampleTab({ cursor: { lineNumber: 2, column: 3 } })])
      })
    )
    await flushPromises()

    const stub = wrapper.get('[data-testid="monaco-stub"]')
    expect(stub.attributes('data-model-id')).toBe('query-1')
    expect(stub.attributes('data-value')).toBe('SELECT 42')
    expect(stub.attributes('data-cursor')).toBe('{"lineNumber":2,"column":3}')
    expect(apiState.tabsSaves).toHaveLength(0)
  })

  it('debounces tab edits by 500 ms and persists the latest text', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mountLab(startupState({ tabs: tabsState([sampleTab()]) }))
      await flushPromises()

      await wrapper.get('[data-testid="monaco-change"]').trigger('click')

      vi.advanceTimersByTime(499)
      await flushPromises()
      expect(apiState.tabsSaves).toHaveLength(0)

      vi.advanceTimersByTime(1)
      await flushPromises()

      expect(apiState.tabsSaves).toHaveLength(1)
      const saved = apiState.tabsSaves[0] as {
        tabs: Array<{ text: string }>
        activeTabId: string
      }
      expect(saved.activeTabId).toBe('query-1')
      expect(saved.tabs[0]?.text).toBe('SELECT 7')
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports a rejected save invoke and keeps saving afterwards', async () => {
    vi.useFakeTimers()
    try {
      apiState.saveThrows = true
      const wrapper = mountLab(startupState({ tabs: tabsState([sampleTab()]) }))
      await flushPromises()

      await wrapper.get('[data-testid="monaco-change"]').trigger('click')
      vi.advanceTimersByTime(500)
      await flushPromises()

      expect(wrapper.text()).toContain('Could not save your data.')
      expect(apiState.tabsSaves).toHaveLength(0)

      // A later save must still run instead of inheriting the rejected chain.
      apiState.saveThrows = false
      await wrapper.get('[data-testid="monaco-change"]').trigger('click')
      vi.advanceTimersByTime(500)
      await flushPromises()

      expect(apiState.tabsSaves).toHaveLength(1)
      expect(wrapper.text()).not.toContain('Could not save your data.')
    } finally {
      vi.useRealTimers()
    }
  })

  it('flushes pending edits when the window asks to close', async () => {
    const wrapper = mountLab(startupState({ tabs: tabsState([sampleTab()]) }))
    await flushPromises()

    await wrapper.get('[data-testid="monaco-change"]').trigger('click')
    await triggerClose()

    expect(apiState.tabsSaves).toHaveLength(1)
    expect(apiState.replies).toEqual([{ ok: true }])
  })

  it('shows recovery warnings with their paths and dismisses them', async () => {
    const warnings: PersistenceWarning[] = [
      {
        code: 'recovered-from-backup',
        paths: ['C:\\data\\tabs_states.yml.bak', 'C:\\data\\tabs_states.yml']
      }
    ]
    const wrapper = mountLab(startupState({ warnings }))

    expect(wrapper.text()).toContain('last valid backup')
    expect(wrapper.text()).toContain('C:\\data\\tabs_states.yml.bak')

    const banner = wrapper.get('[role="region"]')
    await banner.get('button:last-child').trigger('click')

    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('keeps the window open when the flush fails and discards only after confirmation', async () => {
    apiState.saveOk = false
    const wrapper = mountLab(startupState({ tabs: tabsState([sampleTab()]) }))
    await flushPromises()

    await wrapper.get('[data-testid="monaco-change"]').trigger('click')
    await triggerClose()

    expect(apiState.replies.at(-1)).toEqual({ ok: false })
    expect(wrapper.text()).toContain('Could not save before closing')

    const banner = wrapper.get('[role="region"]')
    const exitButton = banner
      .findAll('button')
      .find((button) => button.text() === 'Exit without saving')
    expect(exitButton).toBeDefined()
    await exitButton?.trigger('click')

    expect(wrapper.text()).toContain('Discard unsaved changes and exit?')
    const confirmButton = banner
      .findAll('button')
      .find((button) => button.text() === 'Exit')
    await confirmButton?.trigger('click')

    expect(apiState.replies.at(-1)).toEqual({ ok: true, discard: true })
  })

  it('retries a failed save and replies to the pending close', async () => {
    apiState.saveOk = false
    const wrapper = mountLab(startupState({ tabs: tabsState([sampleTab()]) }))
    await flushPromises()

    await wrapper.get('[data-testid="monaco-change"]').trigger('click')
    await triggerClose()
    expect(apiState.replies.at(-1)).toEqual({ ok: false })

    apiState.saveOk = true
    await wrapper
      .get('[role="region"]')
      .findAll('button')
      .find((button) => button.text() === 'Retry')
      ?.trigger('click')
    await flushPromises()

    expect(apiState.replies.at(-1)).toEqual({ ok: true })
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('announces a successful copy and then returns to the row count', async () => {
    vi.useFakeTimers()
    try {
      const wrapper = mountLab()

      await wrapper.get('[data-testid="grid-copy"]').trigger('click')

      expect(wrapper.get('[role="status"]').text()).toBe('Copied to the clipboard.')

      vi.advanceTimersByTime(2500)
      await flushPromises()
      expect(wrapper.get('[role="status"]').text()).toBe('Rows: 4')
    } finally {
      vi.useRealTimers()
    }
  })

  it('announces a clipboard failure', async () => {
    labState.copyOutcome = 'failure'
    const wrapper = mountLab()

    await wrapper.get('[data-testid="grid-copy"]').trigger('click')

    expect(wrapper.get('[role="status"]').text()).toBe('Could not copy to the clipboard.')
  })

  it('shows the row count and the sample brand in the status bar', () => {
    const wrapper = mountLab()

    expect(wrapper.get('[role="status"]').text()).toBe('Rows: 4')
    expect(wrapper.text()).toContain('Sample data · SeshatSQL')
  })

  it('opens an inert menu and closes it with Escape', async () => {
    const wrapper = mountLab()

    await wrapper.get('.menubar__button').trigger('click')

    const items = wrapper.findAll('.menubar__item')
    expect(items).toHaveLength(6)
    expect(items[0]?.text()).toBe('New')
    expect(items[0]?.attributes('aria-disabled')).toBe('true')
    expect(items[0]?.attributes('title')).toBe('Not available in this preview.')

    await wrapper.get('.menubar__dropdown').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.menubar__dropdown').exists()).toBe(false)
  })

  it('expands a collapsed folder and filters the tree locally', async () => {
    const wrapper = mountLab()

    expect(wrapper.text()).not.toContain('v_customer_totals')
    await wrapper.get('[data-node-id="views"] .object-tree__box').trigger('click')
    expect(wrapper.text()).toContain('v_customer_totals')

    await wrapper.get('.object-tree__filter').setValue('custom')
    expect(wrapper.text()).toContain('customers')
    expect(wrapper.text()).not.toContain('orders')
    expect(wrapper.text()).toContain('Tables (3)')

    await wrapper.get('.object-tree__filter').setValue('missing')
    expect(wrapper.text()).toContain('No matching objects')
  })
})
