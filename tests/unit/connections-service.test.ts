import { describe, expect, it } from 'vitest'

import type { ConnectionInput } from '../../src/application/persistence/ipc-contract'
import type { SecretProtector, SecretResult } from '../../src/application/persistence/secret-protector'
import type { PersistenceStore } from '../../src/application/persistence/store'
import { ConnectionsService } from '../../src/application/persistence/connections-service'
import type {
  ConnectionsV1,
  LoadedPersistence,
  PersistedConnection,
  SaveResult
} from '../../src/domain/persistence/types'

const CORRUPT_CIPHERTEXT = 'Q09SUlVQVA=='

class MemoryStore implements PersistenceStore<ConnectionsV1> {
  value: ConnectionsV1 = { schemaVersion: 1, profiles: [] }
  writes = 0
  blocked = false

  async load(): Promise<LoadedPersistence<ConnectionsV1>> {
    return {
      status: 'loaded',
      value: structuredClone(this.value),
      missing: false,
      warnings: []
    }
  }

  async save(next: ConnectionsV1): Promise<SaveResult> {
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
    id: 'local',
    name: 'Local',
    color: '#ff0000',
    environment: 'dev',
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    ...overrides
  }
}

function setup(): { service: ConnectionsService; store: MemoryStore; protector: FakeProtector } {
  const store = new MemoryStore()
  const protector = new FakeProtector()
  return { service: new ConnectionsService(store, protector), store, protector }
}

describe('ConnectionsService', () => {
  it('encrypts a password before writing and never returns it', async () => {
    const { service, store } = setup()

    const result = await service.save(input({ password: 's3cret' }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile).toEqual({
        id: 'local',
        name: 'Local',
        color: '#ff0000',
        environment: 'dev',
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

  it('keeps the existing ciphertext when no password is supplied', async () => {
    const { service, store } = setup()
    await service.save(input({ password: 's3cret' }))
    const ciphertext = store.value.profiles[0]?.password

    const result = await service.save(input({ name: 'Renamed' }))

    expect(result.ok).toBe(true)
    expect(store.value.profiles[0]?.password).toEqual(ciphertext)
    expect(store.writes).toBe(2)
  })

  it('clears the password when null is supplied', async () => {
    const { service, store } = setup()
    await service.save(input({ password: 's3cret' }))

    const result = await service.save(input({ password: null }))

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

  it('lists profiles without password material', async () => {
    const { service } = setup()
    await service.save(input({ password: 's3cret' }))

    const snapshot = await service.list()

    expect(snapshot.profiles).toEqual([
      {
        id: 'local',
        name: 'Local',
        color: '#ff0000',
        environment: 'dev',
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
    await service.save(input({ password: 's3cret' }))

    expect(await service.resolvePassword('local')).toEqual({ ok: true, value: 's3cret' })
    expect(await service.resolvePassword('missing')).toEqual({ ok: false, reason: 'not-found' })
  })

  it('reports a corrupt ciphertext without deleting it', async () => {
    const { service, store } = setup()
    await service.save(input({ password: 's3cret' }))
    store.value = {
      schemaVersion: 1,
      profiles: store.value.profiles.map((profile): PersistedConnection =>
        profile.id === 'local'
          ? { ...profile, password: { scheme: 'dpapi', data: CORRUPT_CIPHERTEXT } }
          : profile
      )
    }

    expect(await service.resolvePassword('local')).toEqual({
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
    await service.save(input())

    expect(await service.resolvePassword('local')).toEqual({ ok: true, value: null })
  })

  it('deletes an existing profile and reports a missing one', async () => {
    const { service, store } = setup()
    await service.save(input())

    expect(await service.delete('local')).toEqual({ ok: true })
    expect(store.value.profiles).toEqual([])
    expect(await service.delete('local')).toEqual({ ok: false, reason: 'not-found' })
  })
})
