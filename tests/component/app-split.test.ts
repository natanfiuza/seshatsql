// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import AppSplit from '../../src/renderer/src/ui/shell/AppSplit.vue'

const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
let wrapper: VueWrapper | null = null

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 600
  })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  if (originalClientWidth === undefined) {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth')
  } else {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth)
  }
})

function mountSplit(pane: 'start' | 'end', size: number): VueWrapper {
  wrapper = mount(AppSplit, {
    props: {
      direction: 'vertical',
      pane,
      size,
      minStart: 100,
      minEnd: 100,
      label: 'Resize tree'
    },
    slots: {
      start: '<div class="pane-start" />',
      end: '<div class="pane-end" />'
    }
  })
  return wrapper
}

describe('AppSplit', () => {
  it('positions the separator from the start pane and exposes its range', async () => {
    const split = mountSplit('start', 270)
    await flushPromises()
    const separator = split.get('[role="separator"]')

    expect(separator.attributes('aria-valuenow')).toBe('270')
    expect(separator.attributes('aria-valuemin')).toBe('100')
    expect(separator.attributes('aria-valuemax')).toBe('496')
    expect(separator.attributes('aria-orientation')).toBe('vertical')
  })

  it('converts an end-pane size into a separator position', async () => {
    const split = mountSplit('end', 150)
    await flushPromises()

    expect(split.get('[role="separator"]').attributes('aria-valuenow')).toBe('446')
  })

  it('resizes with the keyboard and respects both minimums', async () => {
    const split = mountSplit('start', 270)
    await flushPromises()
    const separator = split.get('[role="separator"]')

    await separator.trigger('keydown', { key: 'ArrowRight' })
    expect(separator.attributes('aria-valuenow')).toBe('278')

    await separator.trigger('keydown', { key: 'Home' })
    expect(separator.attributes('aria-valuenow')).toBe('100')

    await separator.trigger('keydown', { key: 'End' })
    expect(separator.attributes('aria-valuenow')).toBe('496')

    await separator.trigger('keydown', { key: 'ArrowLeft' })
    expect(separator.attributes('aria-valuenow')).toBe('488')
  })
})
