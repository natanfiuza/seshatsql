// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the two stubs replace the real child components */
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
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
  it('renders the shell in the selected locale before any interaction', () => {
    setLocale('pt-BR')

    const wrapper = mountLab()

    expect(wrapper.get('h1').text()).toBe('SeshatSQL')
    expect(wrapper.text()).toContain('Arquivo')
    expect(wrapper.text()).toContain('Tabelas (3)')
    expect(wrapper.text()).toContain('Consulta 1')
    expect(wrapper.text()).toContain('Desconectado')
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

    expect(wrapper.text()).toContain('Fichier')
    expect(wrapper.text()).toContain('Lignes : 4')
    expect(document.documentElement.lang).toBe('fr')
    expect(wrapper.get('[data-testid="monaco-stub"]').attributes('data-locale')).toBe('fr')
    // The notice moved out of the page and became the combobox tooltip.
    expect(wrapper.get('[data-testid="locale-select"]').attributes('title')).toContain(
      "s'applique au prochain démarrage"
    )
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
