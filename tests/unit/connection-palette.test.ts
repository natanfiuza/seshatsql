import { describe, expect, it } from 'vitest'

import {
  CONNECTION_COLORS,
  DEFAULT_CONNECTION_COLOR,
  isConnectionColor
} from '../../src/domain/persistence/connection-palette'

describe('connection palette', () => {
  it('offers exactly eight canonical lowercase colors', () => {
    expect(CONNECTION_COLORS).toHaveLength(8)
    expect(new Set(CONNECTION_COLORS).size).toBe(8)
    for (const color of CONNECTION_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(DEFAULT_CONNECTION_COLOR).toBe(CONNECTION_COLORS[0])
  })

  it('recognizes only palette entries, case-sensitively', () => {
    for (const color of CONNECTION_COLORS) {
      expect(isConnectionColor(color)).toBe(true)
    }
    expect(isConnectionColor('#2563EB')).toBe(false)
    expect(isConnectionColor('#ffffff')).toBe(false)
    expect(isConnectionColor(undefined)).toBe(false)
  })
})
