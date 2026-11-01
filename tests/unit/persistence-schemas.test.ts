import { describe, expect, it } from 'vitest'

import {
  connectionsCodec,
  preferencesCodec,
  tabsStateCodec
} from '../../src/domain/persistence/schemas'
import { toPublicConnection } from '../../src/domain/persistence/redaction'
import type { PersistedConnection } from '../../src/domain/persistence/types'

const TAB = {
  id: 'query-1',
  title: 'Query 1',
  text: 'SELECT 1',
  connectionId: null,
  database: null,
  order: 0,
  cursor: null,
  selection: null
}

const CONNECTION: PersistedConnection = {
  id: 'local',
  name: 'Local',
  color: '#2563eb',
  environment: 'development',
  environmentLabel: null,
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: { scheme: 'dpapi', data: 'AAAA' }
}

describe('preferences schema', () => {
  it('accepts the versioned document and rejects unknown keys', () => {
    expect(preferencesCodec.parse({ schemaVersion: 1, theme: 'dark', locale: 'pt-BR' })).toEqual({
      status: 'valid',
      value: { schemaVersion: 1, theme: 'dark', locale: 'pt-BR' }
    })

    expect(
      preferencesCodec.parse({ schemaVersion: 1, theme: 'dark', locale: 'pt-BR', extra: true })
    ).toMatchObject({ status: 'invalid' })
  })

  it('distinguishes future and older versions from invalid documents', () => {
    expect(preferencesCodec.parse({ schemaVersion: 2, theme: 'dark', locale: 'fr' })).toEqual({
      status: 'future',
      version: 2,
      raw: { schemaVersion: 2, theme: 'dark', locale: 'fr' }
    })

    expect(preferencesCodec.parse({ schemaVersion: 0, theme: 'dark', locale: 'fr' })).toMatchObject({
      status: 'older',
      version: 0
    })

    expect(preferencesCodec.parse({ theme: 'dark', locale: 'fr' })).toEqual({
      status: 'invalid',
      issues: ['schemaVersion:invalid_type']
    })
  })
})

describe('tabs schema', () => {
  it('accepts ordered cursor and selection values', () => {
    const result = tabsStateCodec.parse({
      schemaVersion: 1,
      activeTabId: 'query-1',
      tabs: [
        {
          ...TAB,
          cursor: { lineNumber: 2, column: 4 },
          selection: { startLineNumber: 1, startColumn: 2, endLineNumber: 2, endColumn: 4 }
        }
      ]
    })

    expect(result.status).toBe('valid')
  })

  it('rejects duplicate ids and an active id that references no tab', () => {
    const duplicate = tabsStateCodec.parse({
      schemaVersion: 1,
      activeTabId: 'query-1',
      tabs: [TAB, { ...TAB, order: 1 }]
    })
    expect(duplicate.status).toBe('invalid')

    const dangling = tabsStateCodec.parse({
      schemaVersion: 1,
      activeTabId: 'missing',
      tabs: [TAB]
    })
    expect(dangling.status).toBe('invalid')
  })

  it('rejects unordered selections and non-positive cursor positions', () => {
    const reversed = tabsStateCodec.parse({
      schemaVersion: 1,
      activeTabId: 'query-1',
      tabs: [
        {
          ...TAB,
          selection: { startLineNumber: 3, startColumn: 1, endLineNumber: 2, endColumn: 1 }
        }
      ]
    })
    expect(reversed.status).toBe('invalid')

    const zeroCursor = tabsStateCodec.parse({
      schemaVersion: 1,
      activeTabId: 'query-1',
      tabs: [{ ...TAB, cursor: { lineNumber: 0, column: 1 } }]
    })
    expect(zeroCursor.status).toBe('invalid')
  })
})

describe('connections schema', () => {
  it('accepts a v2 document and normalizes the color to lowercase', () => {
    const parsed = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, color: '#AABBCC' }]
    })

    expect(parsed.status).toBe('valid')
    if (parsed.status === 'valid') {
      expect(parsed.value.profiles[0]?.color).toBe('#aabbcc')
    }
  })

  it('distinguishes v1 as older, v2 as current and v3 as future', () => {
    expect(connectionsCodec.parse({ schemaVersion: 1, profiles: [] })).toMatchObject({
      status: 'older',
      version: 1
    })

    expect(connectionsCodec.parse({ schemaVersion: 2, profiles: [] })).toMatchObject({
      status: 'valid'
    })

    expect(connectionsCodec.parse({ schemaVersion: 3, profiles: [] })).toMatchObject({
      status: 'future',
      version: 3
    })
  })

  it('accepts only OS-encrypted secrets', () => {
    const plaintext = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, password: 'hunter2' }]
    })
    expect(plaintext.status).toBe('invalid')

    const wrongScheme = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, password: { scheme: 'plain', data: 'AAAA' } }]
    })
    expect(wrongScheme.status).toBe('invalid')
  })

  it('requires a label only for the custom environment', () => {
    const custom = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, environment: 'custom', environmentLabel: 'Lab' }]
    })
    expect(custom.status).toBe('valid')

    const customWithoutLabel = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, environment: 'custom', environmentLabel: null }]
    })
    expect(customWithoutLabel.status).toBe('valid')

    const labelOutsideCustom = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, environmentLabel: 'Lab' }]
    })
    expect(labelOutsideCustom.status).toBe('invalid')

    const emptyLabel = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, environment: 'custom', environmentLabel: '' }]
    })
    expect(emptyLabel.status).toBe('invalid')
  })

  it('rejects unknown environments and colors outside the hex shape', () => {
    expect(
      connectionsCodec.parse({
        schemaVersion: 2,
        profiles: [{ ...CONNECTION, environment: 'dev' }]
      }).status
    ).toBe('invalid')

    expect(
      connectionsCodec.parse({
        schemaVersion: 2,
        profiles: [{ ...CONNECTION, color: 'blue' }]
      }).status
    ).toBe('invalid')
  })

  it('rejects duplicate profile ids and out-of-range ports', () => {
    expect(
      connectionsCodec.parse({
        schemaVersion: 2,
        profiles: [CONNECTION, { ...CONNECTION }]
      }).status
    ).toBe('invalid')

    expect(
      connectionsCodec.parse({
        schemaVersion: 2,
        profiles: [{ ...CONNECTION, port: 70000 }]
      }).status
    ).toBe('invalid')
  })

  it('never echoes received values in validation issues', () => {
    const parsed = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, password: 'super-secret-value' }]
    })
    expect(parsed.status).toBe('invalid')
    if (parsed.status === 'invalid') {
      const serialized = parsed.issues.join('\n')
      expect(serialized).not.toContain('super-secret-value')
      expect(serialized).not.toContain('hunter2')
      for (const issue of parsed.issues) {
        expect(issue).toMatch(/^[\w.()[\]]+:(custom|invalid_type|invalid_union|invalid_value)$/)
      }
    }
  })

  it('formats zod issues as path and code only', () => {
    const parsed = connectionsCodec.parse({
      schemaVersion: 2,
      profiles: [{ ...CONNECTION, password: { scheme: 'dpapi', data: 'not base64!' } }]
    })
    expect(parsed.status).toBe('invalid')
    if (parsed.status === 'invalid') {
      expect(parsed.issues).toEqual(['profiles.0.password.data:invalid_format'])
    }
  })
})

describe('redaction', () => {
  it('returns connection metadata without password material', () => {
    const profile: PersistedConnection = { ...CONNECTION, password: { scheme: 'dpapi', data: 'QUJD' } }

    expect(toPublicConnection(profile)).toEqual({
      id: 'local',
      name: 'Local',
      color: '#2563eb',
      environment: 'development',
      environmentLabel: null,
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      hasPassword: true
    })
    expect(toPublicConnection({ ...profile, password: null })).toMatchObject({ hasPassword: false })
  })
})
