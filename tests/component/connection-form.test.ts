// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { PublicConnection } from '../../src/domain/persistence/types'
import { i18n, setLocale } from '../../src/renderer/src/i18n'
import ConnectionForm from '../../src/renderer/src/ui/connections/ConnectionForm.vue'

const SAVED: PublicConnection = {
  id: 'profile-1',
  name: 'Saved',
  color: '#16a34a',
  environment: 'custom',
  environmentLabel: 'Lab',
  host: 'db.internal',
  port: 3307,
  user: 'app',
  hasPassword: true
}

let wrapper: VueWrapper | null = null

function mountForm(profile: PublicConnection | null = null, disabled = false): VueWrapper {
  wrapper = mount(ConnectionForm, {
    attachTo: document.body,
    props: { profile, disabled, serverError: null },
    slots: {
      actions: '<button type="submit">Save</button>'
    },
    global: { plugins: [i18n] }
  })
  return wrapper
}

async function submit(form: VueWrapper): Promise<void> {
  await form.get('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  setLocale('en-US')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('ConnectionForm', () => {
  it('initializes from a saved profile with an empty password field', () => {
    const form = mountForm(SAVED)

    expect((form.get('#connection-name').element as HTMLInputElement).value).toBe('Saved')
    expect((form.get('#connection-host').element as HTMLInputElement).value).toBe('db.internal')
    expect((form.get('#connection-port').element as HTMLInputElement).value).toBe('3307')
    expect((form.get('#connection-user').element as HTMLInputElement).value).toBe('app')
    expect((form.get('#connection-password').element as HTMLInputElement).value).toBe('')
    expect((form.get('#connection-password').element as HTMLInputElement).placeholder).toBe(
      'Leave blank to keep the saved password'
    )
    expect((form.get('#connection-environment-label').element as HTMLInputElement).value).toBe(
      'Lab'
    )
    expect(form.findAll('input[name="connection-color"]')).toHaveLength(8)
    expect(form.text()).toContain('A password is saved for this connection.')
  })

  it('submits an edit with the id and omits an untouched password', async () => {
    const form = mountForm(SAVED)

    await submit(form)

    const input = form.emitted('submit')?.[0]?.[0] as Record<string, unknown>
    expect(input).toEqual({
      id: 'profile-1',
      name: 'Saved',
      color: '#16a34a',
      environment: 'custom',
      environmentLabel: 'Lab',
      host: 'db.internal',
      port: 3307,
      user: 'app'
    })
    expect(input).not.toHaveProperty('password')
  })

  it('clears the field and sends null when the saved password is removed', async () => {
    const form = mountForm(SAVED)
    const password = form.get('#connection-password')

    await password.setValue('temporary')
    await form.get('input[type="checkbox"]').setValue(true)

    expect((password.element as HTMLInputElement).value).toBe('')
    expect((password.element as HTMLInputElement).disabled).toBe(true)
    await submit(form)

    expect(form.emitted('submit')?.[0]?.[0]).toMatchObject({ password: null })
  })

  it('sends a typed password as a string', async () => {
    const form = mountForm(SAVED)

    await form.get('#connection-password').setValue('n3w')
    await submit(form)

    expect(form.emitted('submit')?.[0]?.[0]).toMatchObject({ password: 'n3w' })
  })

  it('creates a profile without an id after requiring custom details', async () => {
    const form = mountForm()
    expect((form.get('#connection-port').element as HTMLInputElement).value).toBe('3306')

    await submit(form)
    expect(form.emitted('submit')).toBeUndefined()
    expect(form.text()).toContain('Required.')
    expect(document.activeElement?.id).toBe('connection-name')

    await form.get('#connection-name').setValue('New')
    await form.get('#connection-host').setValue('localhost')
    await form.get('#connection-user').setValue('root')
    await form.get('#connection-environment').setValue('custom')
    await submit(form)
    expect(form.emitted('submit')).toBeUndefined()
    expect(form.text()).toContain('Describe the custom environment.')

    await form.get('#connection-environment-label').setValue('Experiment')
    await form.findAll('input[name="connection-color"]')[2]?.setValue()
    await submit(form)

    const input = form.emitted('submit')?.[0]?.[0] as Record<string, unknown>
    expect(input).toEqual({
      name: 'New',
      color: '#d97706',
      environment: 'custom',
      environmentLabel: 'Experiment',
      host: 'localhost',
      port: 3306,
      user: 'root'
    })
    expect(input).not.toHaveProperty('id')
    expect(input).not.toHaveProperty('password')
  })

  it('accepts a port edited through the numeric input', async () => {
    const form = mountForm(SAVED)

    await form.get('#connection-port').setValue('3308')
    await submit(form)

    expect(form.emitted('submit')?.[0]?.[0]).toMatchObject({ port: 3308 })
  })

  it('reports dirty state when a field changes', async () => {
    const form = mountForm(SAVED)
    expect(form.emitted('dirty')?.at(-1)).toEqual([false])

    await form.get('#connection-name').setValue('Renamed')

    expect(form.emitted('dirty')?.at(-1)).toEqual([true])
  })

  it('disables its fieldset when the parent blocks writing', () => {
    const form = mountForm(SAVED, true)

    expect(form.get('fieldset.form__fields').attributes('disabled')).toBeDefined()
    expect((form.get('#connection-password').element as HTMLInputElement).disabled).toBe(true)
  })
})
