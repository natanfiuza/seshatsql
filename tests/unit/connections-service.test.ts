import { describe, expect, it } from 'vitest'

import type { ConnectionInput } from '../../src/application/persistence/ipc-contract'
import type { SecretProtector, SecretResult } from '../../src/application/persistence/secret-protector'
import type { PersistenceStore } from '../../src/application/persistence/store'
import { ConnectionsService } from '../../src/application/persistence/connections-service'
import type {
  ConnectionsV2,
  LoadedPersistence,
  PersistedConnection,
  SaveResult
} from '../../src/domain/persistence/types'

const CORRUPT_CIPHERTEXT = 'Q09SUlVQVA=='
const GENERATED_ID = 'generated-id'

class MemoryStore implements PersistenceStore<ConnectionsV2> {
  value: ConnectionsV2 = { schemaVersion: 2, profiles: [] }
  writes = 0
  blocked = false

  async load(): Promise<LoadedPersistence<ConnectionsV2>> {
    return {
      status: 'loaded',
      value: structuredClone(this.value),
      missing: false,
      warnings: []
    }
  }

  async save(next: ConnectionsV2): Promise<SaveResult> {
    if (this.blocked) {
      return { ok: false, reason: 'io-error' }
    }
    this.value = structuredClone(next)
    this.writes += 1
    return { ok: true }
  }

  isWriteBlocked(): boolean {
    return this.blocked
  }
}

class FakeProtector implements SecretProtector {
  available = true
  encryptCalls = 0

  isAvailable(): boolean {
    return this.available
  }

  encrypt(plaintext: string): SecretResult<string> {
    this.encryptCalls += 1
    if (!this.available) {
      return { ok: false, reason: 'encryption-unavailable' }
    }
    return { ok: true, value: Buffer.from(`enc:${plaintext}`, 'utf8').toString('base64') }
  }

  decrypt(data: string): SecretResult<string> {
    if (data === CORRUPT_CIPHERTEXT || !this.available) {
      return { ok: false, reason: 'decryption-failed' }
    }
    return { ok: true, value: Buffer.from(data, 'base64').toString('utf8').replace(/^enc:/, '') }
  }
}

function input(overrides: Partial<ConnectionInput> = {}): ConnectionInput {
  return {
    name: 'Local',
    color: '#2563eb',
    environment: 'development',
    environmentLabel: null,
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    ...overrides
  }
}

function setup(
  newId: () => string = () => GENERATED_ID
): { service: ConnectionsService; store: MemoryStore; protector: FakeProtector } {
  const store = new MemoryStore()
  const protector = new FakeProtector()
  return { service: new ConnectionsService(store, protector, newId), store, protector }
}

async function createProfile(
  service: ConnectionsService,
  overrides: Partial<ConnectionInput> = {}
): Promise<string> {
  const result = await service.save(input(overrides))
  expect(result.ok).toBe(true)
  return result.ok ? result.profile.id : ''
}

describe('ConnectionsService', () => {
  it('creates a profile, encrypts its password and never returns it', async () => {
    const { service, store } = setup()

    const result = await service.save(input({ password: 's3cret' }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile).toEqual({
        id: GENERATED_ID,
        name: 'Local',
        color: '#2563eb',
        environment: 'development',
        environmentLabel: null,
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        hasPassword: true
      })
      expect(JSON.stringify(result)).not.toContain('s3cret')
    }

    const stored = store.value.profiles[0]
    expect(stored?.password).toEqual({
      scheme: 'dpapi',
      data: Buffer.from('enc:s3cret', 'utf8').toString('base64')
    })
  })

  it('generates an id for a new profile', async () => {
    const { service, store } = setup(() => GENERATED_ID)

    const result = await service.save(input({ name: 'New one' }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile.id).toBe(GENERATED_ID)
    }
    expect(store.value.profiles.map((profile) => profile.id)).toEqual([GENERATED_ID])
  })

  it('keeps the existing ciphertext when no password is supplied', async () => {
    const { service, store } = setup()
    const id = await createProfile(service, { password: 's3cret' })
    const ciphertext = store.value.profiles[0]?.password

    const result = await service.save(input({ id, name: 'Renamed' }))

    expect(result.ok).toBe(true)
    expect(store.value.profiles[0]?.password).toEqual(ciphertext)
    expect(store.writes).toBe(2)
  })

  it('clears the password when null is supplied', async () => {
    const { service, store } = setup()
    const id = await createProfile(service, { password: 's3cret' })

    const result = await service.save(input({ id, password: null }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile.hasPassword).toBe(false)
    }
    expect(store.value.profiles[0]?.password).toBeNull()
  })

  it('fails without writing when the protector is unavailable', async () => {
    const { service, store, protector } = setup()
    protector.available = false

    const result = await service.save(input({ password: 's3cret' }))

    expect(result).toEqual({ ok: false, reason: 'encryption-unavailable' })
    expect(store.writes).toBe(0)
  })

  it('wraps a store failure in a typed result', async () => {
    const { service, store } = setup()
    store.blocked = true

    expect(await service.save(input({ password: 's3cret' }))).toEqual({
      ok: false,
      reason: 'io-error'
    })
  })

  it('refuses to edit an id that does not exist', async () => {
    const { service, store } = setup()

    expect(await service.save(input({ id: 'missing' }))).toEqual({
      ok: false,
      reason: 'not-found'
    })
    expect(store.writes).toBe(0)
  })

  it('rejects duplicate names ignoring case and surrounding space', async () => {
    const { service, store } = setup()
    await createProfile(service, { name: 'Local' })

    const result = await service.save(input({ name: '  local  ' }))

    expect(result).toEqual({ ok: false, reason: 'duplicate-name' })
    expect(store.writes).toBe(1)
  })

  it('allows a profile to change only the case of its own name', async () => {
    const { service, store } = setup()
    const id = await createProfile(service, { name: 'Local' })

    const result = await service.save(input({ id, name: 'LOCAL' }))

    expect(result.ok).toBe(true)
    expect(store.value.profiles[0]?.name).toBe('LOCAL')
  })

  it('trims text fields and stores the custom environment label', async () => {
    const { service, store } = setup()

    const result = await service.save(
      input({
        name: '  Lab  ',
        host: ' db.internal ',
        user: ' app ',
        environment: 'custom',
        environmentLabel: '  Experiment  '
      })
    )

    expect(result.ok).toBe(true)
    expect(store.value.profiles[0]).toMatchObject({
      name: 'Lab',
      host: 'db.internal',
      user: 'app',
      environment: 'custom',
      environmentLabel: 'Experiment'
    })
  })

  it('drops the label for a non-custom environment', async () => {
    const { service, store } = setup()

    await service.save(input({ environment: 'production', environmentLabel: 'Wrong' }))

    expect(store.value.profiles[0]?.environmentLabel).toBeNull()
  })

  it('rejects empty required text after trimming', async () => {
    const { service, store } = setup()

    expect(await service.save(input({ name: '   ' }))).toEqual({
      ok: false,
      reason: 'invalid'
    })
    expect(store.writes).toBe(0)
  })

  it('serializes concurrent creations instead of losing one', async () => {
    let counter = 0
    const { service, store } = setup(() => `id-${(counter += 1)}`)

    const results = await Promise.all([
      service.save(input({ name: 'One' })),
      service.save(input({ name: 'Two' }))
    ])

    expect(results.every((result) => result.ok)).toBe(true)
    expect(store.value.profiles.map((profile) => profile.name)).toEqual(['One', 'Two'])
    expect(store.writes).toBe(2)
  })

  it('lists profiles without password material', async () => {
    const { service } = setup()
    await createProfile(service, { password: 's3cret' })

    const snapshot = await service.list()

    expect(snapshot.profiles).toEqual([
      {
        id: GENERATED_ID,
        name: 'Local',
        color: '#2563eb',
        environment: 'development',
        environmentLabel: null,
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        hasPassword: true
      }
    ])
    expect(JSON.stringify(snapshot)).not.toContain('s3cret')
  })

  it('resolves plaintext only through the main-only use case', async () => {
    const { service } = setup()
    const id = await createProfile(service, { password: 's3cret' })

    expect(await service.resolvePassword(id)).toEqual({ ok: true, value: 's3cret' })
    expect(await service.resolvePassword('missing')).toEqual({ ok: false, reason: 'not-found' })
  })

  it('reports a corrupt ciphertext without deleting it', async () => {
    const { service, store } = setup()
    const id = await createProfile(service, { password: 's3cret' })
    store.value = {
      schemaVersion: 2,
      profiles: store.value.profiles.map((profile): PersistedConnection =>
        profile.id === id
          ? { ...profile, password: { scheme: 'dpapi', data: CORRUPT_CIPHERTEXT } }
          : profile
      )
    }

    expect(await service.resolvePassword(id)).toEqual({
      ok: false,
      reason: 'decryption-failed'
    })
    expect(store.value.profiles[0]?.password).toEqual({
      scheme: 'dpapi',
      data: CORRUPT_CIPHERTEXT
    })
  })

  it('returns null for a profile without a password', async () => {
    const { service } = setup()
    const id = await createProfile(service)

    expect(await service.resolvePassword(id)).toEqual({ ok: true, value: null })
  })

  it('deletes an existing profile and reports a missing one', async () => {
    const { service, store } = setup()
    const id = await createProfile(service)

    expect(await service.delete(id)).toEqual({ ok: true })
    expect(store.value.profiles).toEqual([])
    expect(await service.delete(id)).toEqual({ ok: false, reason: 'not-found' })
  })
})
