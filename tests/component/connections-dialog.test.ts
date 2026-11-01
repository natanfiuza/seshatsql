// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ConnectionDeleteResult,
  ConnectionSaveResult
} from '../../src/application/persistence/connections-service'
import type { ConnectionInput } from '../../src/application/persistence/ipc-contract'
import type {
  PersistenceWarning,
  PublicConnection
} from '../../src/domain/persistence/types'
import { i18n, setLocale } from '../../src/renderer/src/i18n'
import ConnectionsDialog from '../../src/renderer/src/ui/connections/ConnectionsDialog.vue'

function profile(overrides: Partial<PublicConnection> = {}): PublicConnection {
  return {
    id: 'alpha',
    name: 'Alpha',
    color: '#2563eb',
    environment: 'custom',
    environmentLabel: 'Lab',
    host: 'db.internal',
    port: 3306,
    user: 'app',
    hasPassword: true,
    ...overrides
  }
}

let profiles: PublicConnection[] = []
let warnings: PersistenceWarning[] = []
let listRejects = false
let listCalls = 0
let savedInputs: ConnectionInput[] = []
let saveResult: (input: ConnectionInput) => ConnectionSaveResult = (input) => ({
  ok: true,
  profile: profile({ ...input, id: 'created', environmentLabel: input.environmentLabel ?? null })
})
let deleteResult: (id: string) => ConnectionDeleteResult = () => ({ ok: true })
let wrapper: VueWrapper | null = null

function mountDialog(): VueWrapper {
  wrapper = mount(ConnectionsDialog, {
    attachTo: document.body,
    props: { open: true },
    global: { plugins: [i18n] }
  })
  return wrapper
}

function installApi(): void {
  const api = {
    connections: {
      list: vi.fn(async () => {
        listCalls += 1
        if (listRejects) {
          throw new Error('ipc unavailable')
        }
        return { profiles: structuredClone(profiles), warnings: structuredClone(warnings) }
      }),
      save: vi.fn(async (input: ConnectionInput) => {
        savedInputs.push(structuredClone(input))
        return saveResult(input)
      }),
      delete: vi.fn(async ({ id }: { id: string }) => deleteResult(id))
    }
  }
  Object.defineProperty(window, 'seshat', { value: api, configurable: true })
}

function button(text: string): HTMLButtonElement {
  const found = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === text
  )
  if (found === undefined) {
    throw new Error(`Button not found: ${text}`)
  }
  return found
}

async function click(text: string): Promise<void> {
  button(text).click()
  await flushPromises()
}

function nameValue(): string {
  return (document.querySelector<HTMLInputElement>('#connection-name') as HTMLInputElement).value
}

async function setName(value: string): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('#connection-name') as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

async function submit(): Promise<void> {
  document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

beforeEach(() => {
  setLocale('en-US')
  profiles = []
  warnings = []
  listRejects = false
  listCalls = 0
  savedInputs = []
  saveResult = (input) => ({
    ok: true,
    profile: profile({ ...input, id: 'created', environmentLabel: input.environmentLabel ?? null })
  })
  deleteResult = () => ({ ok: true })
  installApi()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('ConnectionsDialog', () => {
  it('lists profiles alphabetically and selects the first one', async () => {
    profiles = [
      profile({ id: 'beta', name: 'beta', color: '#16a34a', environment: 'production', environmentLabel: null }),
      profile()
    ]
    mountDialog()
    await flushPromises()

    const names = Array.from(document.querySelectorAll('.connections__name')).map(
      (node) => node.textContent
    )
    expect(names).toEqual(['Alpha', 'beta'])
    const items = document.querySelectorAll<HTMLButtonElement>('.connections__item')
    expect(items[0]?.getAttribute('aria-pressed')).toBe('true')
    expect(items[0]?.getAttribute('aria-label')).toBe('Alpha, Lab, Blue, db.internal:3306')
    expect(nameValue()).toBe('Alpha')
  })

  it('shows the empty state and a creation form', async () => {
    mountDialog()
    await flushPromises()

    expect(document.body.textContent).toContain('No saved connections.')
    expect(nameValue()).toBe('')
    expect(button('Delete').disabled).toBe(true)
    expect(
      document.querySelector('.dialog__panel')?.contains(document.activeElement)
    ).toBe(true)
  })

  it('blocks writing when the list cannot be read', async () => {
    listRejects = true
    mountDialog()
    await flushPromises()

    expect(document.body.textContent).toContain('A storage file could not be read.')
    expect(document.body.textContent).toContain('Connection profiles cannot be changed')
    expect(button('Save').disabled).toBe(true)
    expect(button('New').disabled).toBe(true)
  })

  it('blocks writing for a future schema version', async () => {
    warnings = [{ code: 'future-version', paths: ['connections.yml'], version: 3 }]
    mountDialog()
    await flushPromises()

    expect(document.body.textContent).toContain('written by a newer version')
    expect(document.body.textContent).toContain('(v3)')
    expect(button('Save').disabled).toBe(true)
  })

  it('creates a profile without an id and selects the saved result', async () => {
    profiles = []
    saveResult = (input) => {
      const saved = profile({
        ...input,
        id: 'created',
        environmentLabel: input.environmentLabel ?? null
      })
      profiles = [saved]
      return { ok: true, profile: saved }
    }
    mountDialog()
    await flushPromises()

    await setName('Fresh')
    const host = document.querySelector<HTMLInputElement>('#connection-host') as HTMLInputElement
    host.value = 'localhost'
    host.dispatchEvent(new Event('input', { bubbles: true }))
    const user = document.querySelector<HTMLInputElement>('#connection-user') as HTMLInputElement
    user.value = 'root'
    user.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    await submit()

    expect(savedInputs).toHaveLength(1)
    expect(savedInputs[0]).not.toHaveProperty('id')
    expect(savedInputs[0]).not.toHaveProperty('password')
    expect(savedInputs[0]).toMatchObject({
      name: 'Fresh',
      environment: 'development',
      environmentLabel: null,
      color: '#2563eb'
    })
    expect(nameValue()).toBe('Fresh')
    expect(document.querySelector('.connections__item')?.getAttribute('aria-pressed')).toBe('true')
    expect(button('Delete').disabled).toBe(false)
  })

  it('edits with the existing id and keeps the password when untouched', async () => {
    profiles = [profile()]
    mountDialog()
    await flushPromises()

    await setName('Renamed')
    await submit()

    expect(savedInputs[0]).toMatchObject({ id: 'alpha', name: 'Renamed' })
    expect(savedInputs[0]).not.toHaveProperty('password')
  })

  it('sends null when the saved password is removed', async () => {
    profiles = [profile()]
    mountDialog()
    await flushPromises()

    const checkbox = document.querySelector<HTMLInputElement>(
      'input[type="checkbox"]'
    ) as HTMLInputElement
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()
    await submit()

    expect(savedInputs[0]).toMatchObject({ id: 'alpha', password: null })
  })

  it('shows a duplicate-name failure inside the form', async () => {
    profiles = [profile()]
    saveResult = () => ({ ok: false, reason: 'duplicate-name' })
    mountDialog()
    await flushPromises()

    await submit()

    expect(document.body.textContent).toContain('A connection with this name already exists.')
    expect(listCalls).toBe(1)
  })

  it('confirms deletion in two steps before reloading the list', async () => {
    profiles = [profile()]
    deleteResult = (id) => {
      profiles = profiles.filter((candidate) => candidate.id !== id)
      return { ok: true }
    }
    mountDialog()
    await flushPromises()

    await click('Delete')
    expect(document.body.textContent).toContain('Delete “Alpha”?')
    expect(document.body.textContent).toContain('Tabs are kept')

    await click('Keep connection')
    expect(document.body.textContent).not.toContain('Delete “Alpha”?')
    expect(listCalls).toBe(1)

    await click('Delete')
    await click('Delete connection')

    expect(window.seshat.connections.delete).toHaveBeenCalledWith({ id: 'alpha' })
    expect(document.body.textContent).toContain('No saved connections.')
    expect(nameValue()).toBe('')
  })

  it('guards an unsaved draft before selecting another profile', async () => {
    profiles = [profile(), profile({ id: 'beta', name: 'Beta', environment: 'staging', environmentLabel: null })]
    mountDialog()
    await flushPromises()

    await setName('Draft')
    const items = document.querySelectorAll<HTMLButtonElement>('.connections__item')
    items[1]?.click()
    await flushPromises()

    expect(document.body.textContent).toContain('Discard unsaved changes?')
    expect(nameValue()).toBe('Draft')

    await click('Keep editing')
    expect(nameValue()).toBe('Draft')
    expect(document.body.textContent).not.toContain('Discard unsaved changes?')

    items[1]?.click()
    await flushPromises()
    await click('Discard')

    expect(nameValue()).toBe('Beta')
  })

  it('asks before closing a dirty draft and closes when it is clean', async () => {
    profiles = [profile()]
    const dialog = mountDialog()
    await flushPromises()

    await setName('Draft')
    const panel = document.querySelector<HTMLElement>('.dialog__panel')
    panel?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
    await flushPromises()

    expect(dialog.emitted('close')).toBeUndefined()
    expect(document.body.textContent).toContain('Discard unsaved changes?')

    await click('Discard')
    expect(dialog.emitted('close')).toHaveLength(1)
  })

  it('closes directly when there are no unsaved changes', async () => {
    profiles = [profile()]
    const dialog = mountDialog()
    await flushPromises()

    await click('Cancel')

    expect(dialog.emitted('close')).toHaveLength(1)
  })
})
