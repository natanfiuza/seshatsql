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
  it('enables new query and connections while the other eight actions stay inert', async () => {
    const toolbar = mount(AppToolbar, {
      props: { theme: 'system', locale: 'en-US' },
      global: { plugins: [i18n] }
    })

    const buttons = toolbar.findAll('.toolbar__button')
    expect(buttons).toHaveLength(10)
    for (const button of buttons.slice(1, 9)) {
      expect(button.attributes('aria-disabled')).toBe('true')
      expect(button.attributes('title')).toContain('Not available in this preview.')
    }
    expect(buttons[0]?.attributes('title')).toBe('New query')
    await buttons[0]?.trigger('click')
    expect(toolbar.emitted('activate')?.[0]).toEqual(['new-query'])

    const connections = toolbar.get('[data-testid="connections-trigger"]')
    expect(connections.attributes('aria-disabled')).toBeUndefined()
    expect(connections.attributes('title')).toBe('Connections')
    await connections.trigger('click')
    expect(toolbar.emitted('activate')?.[1]).toEqual(['open-connections'])

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
  it('renders accessible tabs and hides add/close unless enabled', async () => {
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
    expect(strip.find('.tabstrip__add').exists()).toBe(false)
    expect(strip.find('.tabstrip__close').exists()).toBe(false)

    await tabs[1]?.trigger('click')
    expect(strip.emitted('select')?.[0]).toEqual(['query-2'])
  })

  it('emits add and close when the strip is interactive', async () => {
    const strip = mount(AppTabStrip, {
      props: {
        tabs: [
          { id: 'query-1', label: 'Query 1' },
          { id: 'connection:seshat-lab', label: 'Seshat Lab' }
        ],
        activeId: 'query-1',
        label: 'Workspace tabs',
        closable: true,
        addable: true
      },
      global: { plugins: [i18n] }
    })

    const add = strip.get('.tabstrip__add')
    expect(add.attributes('title')).toBe('New query')
    await add.trigger('click')
    expect(strip.emitted('add')).toHaveLength(1)

    const close = strip.findAll('.tabstrip__close')[1]
    expect(close?.attributes('title')).toBe('Close Seshat Lab')
    await close?.trigger('click')
    expect(strip.emitted('close')?.[0]).toEqual(['connection:seshat-lab'])
  })
})

describe('AppStatusBar', () => {
  it('shows connection, detail and brand segments', () => {
    const status = mount(AppStatusBar, {
      props: { detail: 'Rows: 4', connectionName: 'Seshat Lab' },
      global: { plugins: [i18n] }
    })

    expect(status.get('[role="status"]').text()).toBe('Rows: 4')
    expect(status.text()).toContain('Connected (simulation) · Seshat Lab')
    expect(status.text()).toContain('Sample data · SeshatSQL')
  })
})
