// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import AppDialog from '../../src/renderer/src/ui/shell/AppDialog.vue'

let wrapper: VueWrapper | null = null

function mountDialog(returnFocus?: HTMLElement): VueWrapper {
  wrapper = mount(AppDialog, {
    attachTo: document.body,
    props: { open: true, title: 'Test dialog', returnFocus },
    slots: {
      default:
        '<input id="dialog-first" aria-label="First" /><button id="dialog-last" type="button">Last</button>'
    }
  })
  return wrapper
}

function keydown(target: Element, key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('AppDialog', () => {
  it('exposes a modal dialog and focuses its first control', async () => {
    mountDialog()
    await flushPromises()

    const panel = document.querySelector<HTMLElement>('.dialog__panel')
    expect(panel?.getAttribute('role')).toBe('dialog')
    expect(panel?.getAttribute('aria-modal')).toBe('true')
    expect(document.body.textContent).toContain('Test dialog')
    expect(document.activeElement?.id).toBe('dialog-first')
  })

  it('wraps Tab and Shift+Tab inside the panel', async () => {
    mountDialog()
    await flushPromises()

    const first = document.querySelector<HTMLElement>('#dialog-first')
    const last = document.querySelector<HTMLElement>('#dialog-last')
    last?.focus()

    const forward = keydown(last as Element, 'Tab')
    expect(forward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)

    const backward = keydown(first as Element, 'Tab', true)
    expect(backward.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('returns focus to a control outside the panel', async () => {
    mountDialog()
    await flushPromises()

    const external = document.createElement('button')
    external.id = 'external'
    document.body.append(external)
    external.focus()

    await flushPromises()
    expect(document.activeElement?.id).toBe('dialog-first')
  })

  it('requests close on Escape without closing itself', async () => {
    const dialog = mountDialog()
    await flushPromises()

    const panel = document.querySelector<HTMLElement>('.dialog__panel')
    keydown(panel as Element, 'Escape')
    await flushPromises()

    expect(dialog.emitted('request-close')).toHaveLength(1)
    expect(document.querySelector('.dialog__panel')).not.toBeNull()
  })

  it('does not close when the backdrop is clicked', async () => {
    const dialog = mountDialog()
    await flushPromises()

    document
      .querySelector('.dialog__backdrop')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(dialog.emitted('request-close')).toBeUndefined()
    expect(document.querySelector('.dialog__panel')).not.toBeNull()
  })

  it('restores focus on close, falling back to the provided control', async () => {
    const trigger = document.createElement('button')
    trigger.id = 'trigger'
    document.body.append(trigger)
    const dialog = mountDialog(trigger)
    await flushPromises()

    await dialog.setProps({ open: false })
    await flushPromises()

    expect(document.querySelector('.dialog__panel')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
