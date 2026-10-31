// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MonacoEditor from '../../src/renderer/src/editor/MonacoEditor.vue'
import { loadMonaco } from '../../src/renderer/src/editor/monaco'
import { i18n, setLocale } from '../../src/renderer/src/i18n'

type ModelRecord = Record<string, unknown>
type EditorRecord = Record<string, unknown>

const monacoState = vi.hoisted(() => ({
  models: [] as ModelRecord[],
  editors: [] as EditorRecord[],
  created: [] as Array<{ value: string; language: string; uri: string }>,
  themes: [] as string[]
}))

vi.mock('../../src/renderer/src/editor/monaco', () => {
  const api = {
    Uri: { parse: (value: string) => ({ toString: () => value }) },
    editor: {
      getModel: (uri: { toString: () => string }) => {
        return (
          monacoState.models.find(
            (candidate) =>
              (candidate['uri'] as { toString: () => string }).toString() === uri.toString()
          ) ?? null
        )
      },
      createModel: (value: string, language: string, uri: { toString: () => string }) => {
        const listeners = new Set<() => void>()
        const model: ModelRecord = {
          value,
          language,
          uri,
          disposeCount: 0,
          onDidChangeContent: (callback: () => void) => {
            listeners.add(callback)
            return { dispose: () => listeners.delete(callback) }
          },
          getValue: () => model['value'],
          getLanguageId: () => language,
          setValue: (next: string) => {
            model['value'] = next
            for (const listener of listeners) {
              listener()
            }
          },
          dispose: () => {
            model['disposeCount'] = (model['disposeCount'] as number) + 1
          }
        }
        monacoState.created.push({ value, language, uri: uri.toString() })
        monacoState.models.push(model)
        return model
      },
      create: (_host: HTMLElement, options: Record<string, unknown>) => {
        const cursorListeners = new Set<() => void>()
        let position = { lineNumber: 1, column: 1 }
        let selection = {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          isEmpty: () => true
        }

        const editor: EditorRecord = {
          options,
          disposeCount: 0,
          restored: null,
          focused: 0,
          saveViewState: () => ({ id: 'view-state' }),
          restoreViewState: (state: unknown) => {
            editor['restored'] = state
          },
          focus: () => {
            editor['focused'] = (editor['focused'] as number) + 1
          },
          getPosition: () => position,
          getSelection: () => selection,
          setPosition: (next: { lineNumber: number; column: number }) => {
            position = next
            selection = {
              ...next,
              startLineNumber: next.lineNumber,
              startColumn: next.column,
              endLineNumber: next.lineNumber,
              endColumn: next.column,
              isEmpty: () => true
            }
            editor['position'] = position
          },
          setSelection: (next: {
            startLineNumber: number
            startColumn: number
            endLineNumber: number
            endColumn: number
          }) => {
            selection = {
              ...next,
              isEmpty: () =>
                next.startLineNumber === next.endLineNumber && next.startColumn === next.endColumn
            }
            position = { lineNumber: next.endLineNumber, column: next.endColumn }
            editor['selection'] = next
          },
          onDidChangeCursorSelection: (callback: () => void) => {
            cursorListeners.add(callback)
            return { dispose: () => cursorListeners.delete(callback) }
          },
          moveTo: (next: { lineNumber: number; column: number }) => {
            position = next
            for (const listener of cursorListeners) {
              listener()
            }
          },
          dispose: () => {
            editor['disposeCount'] = (editor['disposeCount'] as number) + 1
          }
        }
        monacoState.editors.push(editor)
        return editor
      },
      setTheme: (theme: string) => {
        monacoState.themes.push(theme)
      }
    }
  }

  return { loadMonaco: vi.fn(() => Promise.resolve(api)) }
})

const baseProps = {
  modelId: 'tab-1',
  value: 'SELECT 1',
  theme: 'light',
  locale: 'en-US'
} as const

function mountEditor() {
  return mount(MonacoEditor, {
    props: { ...baseProps },
    global: { plugins: [i18n] }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  monacoState.models.length = 0
  monacoState.editors.length = 0
  monacoState.created.length = 0
  monacoState.themes.length = 0
  setLocale('en-US')
})

describe('MonacoEditor', () => {
  it('creates a mysql model under the tab URI and mounts the editor', async () => {
    const wrapper = mountEditor()
    await flushPromises()

    expect(monacoState.created).toEqual([
      { value: 'SELECT 1', language: 'mysql', uri: 'inmemory://seshat/tab/tab-1' }
    ])
    expect(wrapper.get('[data-testid="monaco-editor"]').attributes('data-model-uri')).toBe(
      'inmemory://seshat/tab/tab-1'
    )
    expect(monacoState.editors[0]?.['options']).toMatchObject({
      theme: 'vs',
      ariaLabel: 'SQL editor'
    })
  })

  it('switches the Monaco theme when the resolved theme changes', async () => {
    const wrapper = mountEditor()
    await flushPromises()

    await wrapper.setProps({ theme: 'dark' })

    expect(monacoState.themes).toEqual(['vs-dark'])
  })

  it('pushes external value changes into the model and emits content changes', async () => {
    const wrapper = mountEditor()
    await flushPromises()
    const model = monacoState.models[0] as {
      setValue: (value: string) => void
      getValue: () => string
    }

    await wrapper.setProps({ value: 'SELECT 2' })
    expect(model.getValue()).toBe('SELECT 2')

    model.setValue('SELECT 3')
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['SELECT 3'])
  })

  it('restores the persisted cursor without re-saving it as a user change', async () => {
    const wrapper = mount(MonacoEditor, {
      props: { ...baseProps, cursor: { lineNumber: 3, column: 5 } },
      global: { plugins: [i18n] }
    })
    await flushPromises()

    expect(monacoState.editors[0]?.['position']).toEqual({ lineNumber: 3, column: 5 })
    expect(wrapper.emitted('view')).toBeUndefined()
  })

  it('restores a persisted selection and emits later cursor moves', async () => {
    const selection = {
      startLineNumber: 1,
      startColumn: 2,
      endLineNumber: 2,
      endColumn: 4
    }
    const wrapper = mount(MonacoEditor, {
      props: { ...baseProps, selection },
      global: { plugins: [i18n] }
    })
    await flushPromises()

    expect(monacoState.editors[0]?.['selection']).toEqual(selection)
    expect(wrapper.emitted('view')).toBeUndefined()

    const editor = monacoState.editors[0] as { moveTo: (next: { lineNumber: number; column: number }) => void }
    editor.moveTo({ lineNumber: 2, column: 4 })

    expect(wrapper.emitted('view')?.at(-1)).toEqual([
      { lineNumber: 2, column: 4 },
      selection
    ])
  })

  it('exposes view state and focus through the component API', async () => {
    const wrapper = mountEditor()
    await flushPromises()

    const exposed = wrapper.vm as unknown as {
      getViewState: () => unknown
      setViewState: (state: unknown) => void
      focus: () => void
    }

    expect(exposed.getViewState()).toEqual({ id: 'view-state' })
    exposed.setViewState({ id: 'restored' })
    expect(monacoState.editors[0]?.['restored']).toEqual({ id: 'restored' })

    exposed.focus()
    expect(monacoState.editors[0]?.['focused']).toBe(1)
  })

  it('disposes the editor and the model on unmount', async () => {
    const wrapper = mountEditor()
    await flushPromises()

    wrapper.unmount()

    expect(monacoState.editors[0]?.['disposeCount']).toBe(1)
    expect(monacoState.models[0]?.['disposeCount']).toBe(1)
  })

  it('shows the localized failure message when Monaco cannot be loaded', async () => {
    vi.mocked(loadMonaco).mockRejectedValueOnce(new Error('boom'))

    const wrapper = mountEditor()
    await flushPromises()

    expect(wrapper.text()).toContain('The SQL editor could not be loaded.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
