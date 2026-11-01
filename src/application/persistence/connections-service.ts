import { toPublicConnection } from '../../domain/persistence/redaction'
import {
  CONNECTIONS_SCHEMA_VERSION,
  type ConnectionsV2,
  type PersistedConnection,
  type PersistenceWarning,
  type PublicConnection,
  type SaveFailureReason
} from '../../domain/persistence/types'
import type { ConnectionInput } from './ipc-contract'
import type { SecretFailureReason, SecretProtector } from './secret-protector'
import type { PersistenceStore } from './store'

export type ConnectionFailureReason =
  | SaveFailureReason
  | SecretFailureReason
  | 'duplicate-name'
  | 'not-found'
  | 'invalid'
  | 'internal'

export type ConnectionSaveResult =
  | { readonly ok: true; readonly profile: PublicConnection }
  | { readonly ok: false; readonly reason: ConnectionFailureReason }

export type ConnectionDeleteResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: ConnectionFailureReason }

export type SecretResolution =
  | { readonly ok: true; readonly value: string | null }
  | { readonly ok: false; readonly reason: 'not-found' | SecretFailureReason }

export interface ConnectionsSnapshot {
  readonly profiles: readonly PublicConnection[]
  readonly warnings: readonly PersistenceWarning[]
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Application use cases for connection profiles. Passwords enter through
 * save(), are encrypted before touching the store, and are never returned.
 */
export class ConnectionsService {
  private tail: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly store: PersistenceStore<ConnectionsV2>,
    private readonly protector: SecretProtector,
    private readonly newId: () => string = () => globalThis.crypto.randomUUID()
  ) {}

  async list(): Promise<ConnectionsSnapshot> {
    const loaded = await this.store.load()
    return {
      profiles: loaded.value.profiles.map(toPublicConnection),
      warnings: loaded.warnings
    }
  }

  save(input: ConnectionInput): Promise<ConnectionSaveResult> {
    return this.enqueue(async () => {
      const loaded = await this.store.load()
      const profiles = [...loaded.value.profiles]
      const index = input.id === undefined ? -1 : profiles.findIndex((profile) => profile.id === input.id)

      // Editing an id that no longer exists must never create a second profile.
      if (input.id !== undefined && index < 0) {
        return { ok: false, reason: 'not-found' }
      }

      const name = input.name.trim()
      const host = input.host.trim()
      const user = input.user.trim()
      const environmentLabel = input.environment === 'custom' ? (input.environmentLabel?.trim() ?? null) : null
      if (name.length === 0 || host.length === 0 || user.length === 0) {
        return { ok: false, reason: 'invalid' }
      }

      const duplicate = profiles.some(
        (profile, profileIndex) => profileIndex !== index && normalizeName(profile.name) === normalizeName(name)
      )
      if (duplicate) {
        return { ok: false, reason: 'duplicate-name' }
      }

      const existing = index >= 0 ? profiles[index] : undefined
      let password = existing?.password ?? null
      if (input.password !== undefined) {
        if (input.password === null) {
          password = null
        } else {
          const encrypted = this.protector.encrypt(input.password)
          if (!encrypted.ok) {
            return { ok: false, reason: encrypted.reason }
          }
          password = { scheme: 'dpapi', data: encrypted.value }
        }
      }

      const profile: PersistedConnection = {
        id: input.id ?? this.newId(),
        name,
        color: input.color,
        environment: input.environment,
        environmentLabel,
        host,
        port: input.port,
        user,
        password
      }

      if (index >= 0) {
        profiles[index] = profile
      } else {
        profiles.push(profile)
      }

      const saved = await this.store.save({
        schemaVersion: CONNECTIONS_SCHEMA_VERSION,
        profiles
      })
      if (!saved.ok) {
        return { ok: false, reason: saved.reason }
      }
      return { ok: true, profile: toPublicConnection(profile) }
    })
  }

  delete(id: string): Promise<ConnectionDeleteResult> {
    return this.enqueue(async () => {
      const loaded = await this.store.load()
      const profiles = loaded.value.profiles.filter((profile) => profile.id !== id)
      if (profiles.length === loaded.value.profiles.length) {
        return { ok: false, reason: 'not-found' }
      }
      const saved = await this.store.save({
        schemaVersion: CONNECTIONS_SCHEMA_VERSION,
        profiles
      })
      return saved.ok ? { ok: true } : { ok: false, reason: saved.reason }
    })
  }

  /**
   * Main-process-only use case for future connection code. It is not part of
   * the preload surface, so plaintext never reaches the renderer.
   */
  async resolvePassword(id: string): Promise<SecretResolution> {
    const loaded = await this.store.load()
    const profile = loaded.value.profiles.find((candidate) => candidate.id === id)
    if (profile === undefined) {
      return { ok: false, reason: 'not-found' }
    }
    if (profile.password === null) {
      return { ok: true, value: null }
    }
    const decrypted = this.protector.decrypt(profile.password.data)
    return decrypted.ok
      ? { ok: true, value: decrypted.value }
      : { ok: false, reason: decrypted.reason }
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.tail.then(task, task)
    this.tail = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }
}
