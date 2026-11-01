import { describe, expect, it } from 'vitest'

import { connectionInputSchema } from '../../src/application/persistence/ipc-contract'

const INPUT = {
  name: 'Local',
  color: '#2563eb',
  environment: 'development',
  environmentLabel: null,
  host: '127.0.0.1',
  port: 3306,
  user: 'root'
} as const

describe('connection input contract', () => {
  it('accepts a create without id and with an omitted password', () => {
    const parsed = connectionInputSchema.safeParse(INPUT)

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual(INPUT)
    }
  })

  it('accepts an edit with id and either password form', () => {
    expect(
      connectionInputSchema.safeParse({ ...INPUT, id: 'local', password: 's3cret' }).success
    ).toBe(true)
    expect(
      connectionInputSchema.safeParse({ ...INPUT, id: 'local', password: null }).success
    ).toBe(true)
  })

  it('trims text before enforcing the limits', () => {
    const parsed = connectionInputSchema.safeParse({
      ...INPUT,
      name: '  Local  ',
      host: ' db.internal ',
      user: ' app '
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        name: 'Local',
        host: 'db.internal',
        user: 'app'
      })
    }
  })

  it('requires a label for custom and forbids it otherwise', () => {
    expect(
      connectionInputSchema.safeParse({
        ...INPUT,
        environment: 'custom',
        environmentLabel: null
      }).success
    ).toBe(false)

    expect(
      connectionInputSchema.safeParse({
        ...INPUT,
        environment: 'custom',
        environmentLabel: 'Lab'
      }).success
    ).toBe(true)

    expect(
      connectionInputSchema.safeParse({ ...INPUT, environmentLabel: 'Lab' }).success
    ).toBe(false)
  })

  it('rejects colors outside the fixed palette and out-of-range ports', () => {
    expect(
      connectionInputSchema.safeParse({ ...INPUT, color: '#ffffff' }).success
    ).toBe(false)
    expect(connectionInputSchema.safeParse({ ...INPUT, port: 0 }).success).toBe(false)
    expect(connectionInputSchema.safeParse({ ...INPUT, port: 65536 }).success).toBe(false)
    expect(connectionInputSchema.safeParse({ ...INPUT, port: '3306' }).success).toBe(false)
  })

  it('rejects blank names, hosts and users after trimming', () => {
    for (const field of ['name', 'host', 'user'] as const) {
      expect(connectionInputSchema.safeParse({ ...INPUT, [field]: '   ' }).success).toBe(false)
    }
  })
})
