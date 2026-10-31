// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the two stubs replace the real child components */
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n, setLocale } from '../../src/renderer/src/i18n'
import S05Lab from '../../src/renderer/src/ui/S05Lab.vue'

const labState = vi.hoisted(() => ({
  copyOutcome: 'success' as 'success' | 'failure'
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
        locale: { type: String, required: true }
      },
      setup(props) {
        return () =>
          h('div', {
            'data-testid': 'monaco-stub',
            'data-theme': props.theme,
            'data-locale': props.locale
          })
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

function mountLab(): VueWrapper {
  return mount(S05Lab, { global: { plugins: [i18n] } })
}

beforeEach(() => {
  labState.copyOutcome = 'success'
  setLocale('en-US')
  delete document.documentElement.dataset.theme
  document.documentElement.style.colorScheme = ''
})

describe('S05Lab', () => {
  it('renders the interface in the selected locale before any interaction', () => {
    setLocale('pt-BR')

    const wrapper = mountLab()

    expect(wrapper.get('h1').text()).toBe('SeshatSQL')
    expect(wrapper.text()).toContain('Laboratório de interface')
    expect(wrapper.text()).toContain('O idioma do editor é aplicado na próxima inicialização')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-locale')).toBe('pt-BR')
  })

  it('applies the chosen theme to the document and to the editor', async () => {
    const wrapper = mountLab()
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-theme')).toBe('light')

    await wrapper.get('[data-testid="theme-select"]').setValue('dark')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-theme')).toBe('dark')
  })

  it('switches the interface language live and records it on the document', async () => {
    const wrapper = mountLab()

    await wrapper.get('[data-testid="locale-select"]').setValue('fr')

    expect(wrapper.text()).toContain("Laboratoire d'interface")
    expect(wrapper.text()).toContain("La langue de l'éditeur s'applique au prochain démarrage")
    expect(document.documentElement.lang).toBe('fr')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-locale')).toBe('fr')
  })

  it('announces a successful copy', async () => {
    const wrapper = mountLab()

    await wrapper.get('[data-testid="grid-copy"]').trigger('click')

    expect(wrapper.get('[role="status"]').text()).toBe('Copied to the clipboard.')
  })

  it('announces a clipboard failure', async () => {
    labState.copyOutcome = 'failure'
    const wrapper = mountLab()

    await wrapper.get('[data-testid="grid-copy"]').trigger('click')

    expect(wrapper.get('[role="status"]').text()).toBe('Could not copy to the clipboard.')
  })
})
