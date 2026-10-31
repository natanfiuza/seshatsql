// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { i18n, setLocale } from '../../src/renderer/src/i18n'
import AppMenuBar from '../../src/renderer/src/ui/shell/AppMenuBar.vue'

let wrapper: VueWrapper | null = null

function mountMenu(): VueWrapper {
  wrapper = mount(AppMenuBar, {
    attachTo: document.body,
    global: { plugins: [i18n] }
  })
  return wrapper
}

beforeEach(() => {
  setLocale('en-US')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('AppMenuBar', () => {
  it('opens a menu on click with inert items and a tooltip', async () => {
    const menu = mountMenu()

    await menu.get('.menubar__button').trigger('click')

    const items = menu.findAll('.menubar__item')
    expect(items).toHaveLength(6)
    expect(items[0]?.text()).toBe('New')
    expect(items[0]?.attributes('aria-disabled')).toBe('true')
    expect(items[0]?.attributes('title')).toBe('Not available in this preview.')
    expect(menu.get('.menubar__button').attributes('aria-expanded')).toBe('true')
  })

  it('opens with the keyboard and focuses the first item', async () => {
    const menu = mountMenu()

    await menu.get('.menubar__button').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(menu.findAll('.menubar__item')[0]?.element).toBe(document.activeElement)

    await menu.get('.menubar__dropdown').trigger('keydown', { key: 'ArrowDown' })
    expect(menu.findAll('.menubar__item')[1]?.element).toBe(document.activeElement)

    await menu.get('.menubar__dropdown').trigger('keydown', { key: 'ArrowUp' })
    expect(menu.findAll('.menubar__item')[0]?.element).toBe(document.activeElement)
  })

  it('closes with Escape and restores focus to the menu button', async () => {
    const menu = mountMenu()

    await menu.get('.menubar__button').trigger('click')
    await flushPromises()
    await menu.get('.menubar__dropdown').trigger('keydown', { key: 'Escape' })

    expect(menu.find('.menubar__dropdown').exists()).toBe(false)
    expect(menu.get('.menubar__button').element).toBe(document.activeElement)
  })

  it('moves to the next menu with the arrow keys while open', async () => {
    const menu = mountMenu()

    await menu.get('.menubar__button').trigger('click')
    await flushPromises()
    await menu.get('.menubar__dropdown').trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()

    expect(menu.get('.menubar__button').attributes('aria-expanded')).toBe('false')
    expect(menu.findAll('.menubar__item')[0]?.text()).toBe('Undo')
    expect(menu.findAll('.menubar__item')[0]?.element).toBe(document.activeElement)
  })

  it('closes when the pointer goes down outside of the menu bar', async () => {
    const menu = mountMenu()

    await menu.get('.menubar__button').trigger('click')
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()

    expect(menu.find('.menubar__dropdown').exists()).toBe(false)
  })
})
