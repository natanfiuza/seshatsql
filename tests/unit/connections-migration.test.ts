import { describe, expect, it } from 'vitest'

import { DEFAULT_CONNECTION_COLOR } from '../../src/domain/persistence/connection-palette'
import { migrateConnectionsV1ToV2 } from '../../src/domain/persistence/connections-migration'
import type { PersistedConnectionV1 } from '../../src/domain/persistence/types'

const CIPHERTEXT = { scheme: 'dpapi', data: 'QUJD' } as const

function legacy(overrides: Partial<PersistedConnectionV1> = {}): PersistedConnectionV1 {
  return {
    id: 'local',
    name: 'Local',
    color: '#AABBCC',
    environment: 'dev',
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: CIPHERTEXT,
    ...overrides
  }
}

function migrate(profiles: readonly PersistedConnectionV1[]) {
  return migrateConnectionsV1ToV2({ schemaVersion: 1, profiles })
}

describe('connections v1 migration', () => {
  it('maps known environment aliases and clears the label', () => {
    const result = migrate([
      legacy({ id: 'a', environment: 'dev' }),
      legacy({ id: 'b', environment: ' Desenvolvimento ' }),
      legacy({ id: 'c', environment: 'test' }),
      legacy({ id: 'd', environment: 'Homologação' }),
      legacy({ id: 'e', environment: 'prod' }),
      legacy({ id: 'f', environment: 'PRODUÇÃO' })
    ])

    expect(result.profiles.map((profile) => profile.environment)).toEqual([
      'development',
      'development',
      'staging',
      'staging',
      'production',
      'production'
    ])
    expect(result.profiles.every((profile) => profile.environmentLabel === null)).toBe(true)
  })

  it('turns unknown or empty environments into a custom label', () => {
    const result = migrate([
      legacy({ id: 'a', environment: '  Lab interno  ' }),
      legacy({ id: 'b', environment: '   ' })
    ])

    expect(result.profiles[0]).toMatchObject({
      environment: 'custom',
      environmentLabel: 'Lab interno'
    })
    expect(result.profiles[1]).toMatchObject({
      environment: 'custom',
      environmentLabel: null
    })
  })

  it('normalizes valid colors and falls back to the default palette entry', () => {
    const result = migrate([
      legacy({ id: 'a', color: '#AaBbCc' }),
      legacy({ id: 'b', color: '' }),
      legacy({ id: 'c', color: 'red' })
    ])

    expect(result.profiles.map((profile) => profile.color)).toEqual([
      '#aabbcc',
      DEFAULT_CONNECTION_COLOR,
      DEFAULT_CONNECTION_COLOR
    ])
  })

  it('preserves ids, duplicate names, empty users and the ciphertext', () => {
    const result = migrate([
      legacy({ id: 'a', name: 'Same', user: '' }),
      legacy({ id: 'b', name: 'Same', user: '' })
    ])

    expect(result.profiles.map((profile) => profile.id)).toEqual(['a', 'b'])
    expect(result.profiles.map((profile) => profile.name)).toEqual(['Same', 'Same'])
    expect(result.profiles.map((profile) => profile.user)).toEqual(['', ''])
    expect(result.profiles[0]?.password).toEqual(CIPHERTEXT)
    expect(result.schemaVersion).toBe(2)
  })

  it('throws instead of rewriting an invalid v1 document', () => {
    expect(() =>
      migrateConnectionsV1ToV2({
        schemaVersion: 1,
        profiles: [{ ...legacy(), password: 'hunter2' }]
      })
    ).toThrow()
  })
})
