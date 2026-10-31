// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { i18n, setLocale } from '../../src/renderer/src/i18n'
import AppStatusBar from '../../src/renderer/src/ui/shell/AppStatusBar.vue'
import AppTabStrip from '../../src/renderer/src/ui/shell/AppTabStrip.vue'
import AppToolbar from '../../src/renderer/src/ui/shell/AppToolbar.vue'

beforeEach(() => {
  setLocale('en-US')
})

describe('AppToolbar', () => {
  it('renders inert actions with tooltips and the two working combos', async () => {
    const toolbar = mount(AppToolbar, {
      props: { theme: 'system', locale: 'en-US' },
      global: { plugins: [i18n] }
    })

    const buttons = toolbar.findAll('.toolbar__button')
    expect(buttons).toHaveLength(10)
    for (const button of buttons) {
      expect(button.attributes('aria-disabled')).toBe('true')
      expect(button.attributes('title')).toContain('Not available in this preview.')
    }
    expect(buttons[0]?.attributes('title')).toBe('New query — Not available in this preview.')

    await toolbar.get('[data-testid="theme-select"]').setValue('dark')
    expect(toolbar.emitted('update:theme')?.[0]).toEqual(['dark'])

    await toolbar.get('[data-testid="locale-select"]').setValue('fr')
    expect(toolbar.emitted('update:locale')?.[0]).toEqual(['fr'])
    expect(toolbar.get('[data-testid="locale-select"]').attributes('title')).toContain(
      'applies on the next launch'
    )
  })
})

describe('AppTabStrip', () => {
  it('renders accessible tabs with inert add and close affordances', async () => {
    const strip = mount(AppTabStrip, {
      props: {
        tabs: [
          { id: 'query-1', label: 'Query 1' },
          { id: 'query-2', label: 'Query 2' }
        ],
        activeId: 'query-1',
        label: 'Editor tabs'
      },
      global: { plugins: [i18n] }
    })

    const tabs = strip.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]?.attributes('aria-selected')).toBe('true')
    expect(tabs[0]?.attributes('tabindex')).toBe('0')
    expect(tabs[1]?.attributes('tabindex')).toBe('-1')

    expect(strip.get('.tabstrip__add').attributes('aria-disabled')).toBe('true')
    expect(strip.get('.tabstrip__add').attributes('title')).toBe(
      'New tab — Not available in this preview.'
    )
    expect(strip.get('.tabstrip__close').attributes('aria-disabled')).toBe('true')

    await tabs[1]?.trigger('click')
    expect(strip.emitted('select')?.[0]).toEqual(['query-2'])
  })
})

describe('AppStatusBar', () => {
  it('shows connection, detail and brand segments', () => {
    const status = mount(AppStatusBar, {
      props: { detail: 'Rows: 4' },
      global: { plugins: [i18n] }
    })

    expect(status.get('[role="status"]').text()).toBe('Rows: 4')
    expect(status.text()).toContain('Disconnected')
    expect(status.text()).toContain('Sample data · SeshatSQL')
  })
})
