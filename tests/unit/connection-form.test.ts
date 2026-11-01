import { describe, expect, it } from 'vitest'

import {
  connectionColorKey,
  connectionFailureMessageKey,
  environmentMessageKey,
  sortConnections,
  validationMessageKey
} from '../../src/renderer/src/ui/connections/presentation'
import {
  validateConnectionForm,
  type ConnectionFormValues
} from '../../src/renderer/src/ui/connections/validation'

const VALID: ConnectionFormValues = {
  name: 'Local',
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  environment: 'development',
  environmentLabel: '',
  color: '#2563eb'
}

function validate(overrides: Partial<ConnectionFormValues> = {}) {
  return validateConnectionForm({ ...VALID, ...overrides })
}

describe('connection form validation', () => {
  it('accepts a complete development profile', () => {
    expect(validate()).toEqual([])
  })

  it('reports blank required fields in top-to-bottom order', () => {
    expect(
      validate({ name: '   ', host: '', port: '', user: '' }).map((issue) => issue.field)
    ).toEqual(['name', 'host', 'port', 'user'])
  })

  it('enforces text limits and port range', () => {
    expect(validate({ name: 'n'.repeat(101) })).toEqual([
      { field: 'name', code: 'name-too-long' }
    ])
    expect(validate({ host: 'h'.repeat(254) })).toEqual([
      { field: 'host', code: 'host-too-long' }
    ])
    expect(validate({ user: 'u'.repeat(129) })).toEqual([
      { field: 'user', code: 'user-too-long' }
    ])
    for (const port of ['0', '65536', '33a6', '-1']) {
      expect(validate({ port })).toEqual([{ field: 'port', code: 'port-range' }])
    }
  })

  it('requires a label only for a custom environment', () => {
    expect(validate({ environment: 'custom', environmentLabel: '  ' })).toEqual([
      { field: 'environmentLabel', code: 'environment-label-required' }
    ])
    expect(validate({ environment: 'custom', environmentLabel: 'L'.repeat(33) })).toEqual([
      { field: 'environmentLabel', code: 'environment-label-too-long' }
    ])
    expect(validate({ environmentLabel: 'Ignored' })).toEqual([])
  })

  it('rejects colors outside the fixed palette', () => {
    expect(validate({ color: '#ffffff' })).toEqual([{ field: 'color', code: 'color-required' }])
  })
})

describe('connection presentation', () => {
  it('maps environments, colors, failures and validation codes to keys', () => {
    expect(environmentMessageKey('staging')).toBe('connections.environment.staging')
    expect(environmentMessageKey('custom')).toBe('connections.environment.custom')
    expect(connectionColorKey('#db2777')).toBe('connections.color.pink')
    expect(connectionColorKey('#ffffff')).toBe('connections.color.gray')
    expect(connectionFailureMessageKey('duplicate-name')).toBe(
      'connections.errors.duplicateName'
    )
    expect(connectionFailureMessageKey('encryption-unavailable')).toBe(
      'connections.errors.encryptionUnavailable'
    )
    expect(validationMessageKey('environment-label-required')).toBe(
      'connections.errors.environmentLabelRequired'
    )
  })

  it('sorts by name ignoring case, then by id as a stable tie-break', () => {
    const sorted = sortConnections([
      { id: '1', name: 'beta' },
      { id: '2', name: 'Alpha' },
      { id: 'b', name: 'Same' },
      { id: 'a', name: 'Same' }
    ])

    expect(sorted.map((profile) => profile.id)).toEqual(['2', '1', 'a', 'b'])
  })
})
