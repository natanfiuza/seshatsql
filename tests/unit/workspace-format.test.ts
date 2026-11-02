import { describe, expect, it } from 'vitest'

import {
  formatBoolean,
  formatBytes,
  formatDateTime,
  formatEstimatedRows,
  formatFieldValue,
  formatNumber,
  formatObjectType,
  formatScope,
  formatValue
} from '../../src/renderer/src/ui/workspace/format'

const LABELS: Record<string, string> = {
  'shell.workspace.notAvailable': 'n/a',
  'shell.workspace.units.byte': 'B',
  'shell.workspace.units.kilobyte': 'KB',
  'shell.workspace.units.megabyte': 'MB',
  'shell.workspace.units.gigabyte': 'GB',
  'shell.workspace.units.terabyte': 'TB',
  'shell.workspace.values.yes': 'Yes',
  'shell.workspace.values.no': 'No',
  'shell.workspace.values.global': 'Global',
  'shell.workspace.values.session': 'Session',
  'shell.workspace.objectTypes.table': 'Table',
  'shell.workspace.objectTypes.view': 'View',
  'shell.workspace.objectTypes.event': 'Event',
  'shell.workspace.values.none': 'None'
}

const translate = (key: string): string => LABELS[key] ?? key

describe('workspace formatting', () => {
  it('formats numbers with the requested locale', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567')
    expect(formatNumber(1234567, 'pt-BR')).toBe('1.234.567')
    expect(formatEstimatedRows(1240, 'en-US')).toBe('~1,240')
    expect(formatEstimatedRows(null, 'en-US')).toBe('~0')
  })

  it('formats bytes with localized units', () => {
    expect(formatBytes(0, 'en-US', translate)).toBe('0 B')
    expect(formatBytes(512, 'en-US', translate)).toBe('512 B')
    expect(formatBytes(1536, 'en-US', translate)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024, 'en-US', translate)).toBe('5 MB')
    expect(formatBytes(null, 'en-US', translate)).toBe('n/a')
  })

  it('formats dates in UTC and handles invalid values', () => {
    const english = formatDateTime('2026-11-01T09:42:00Z', 'en-US', translate)
    const portuguese = formatDateTime('2026-11-01T09:42:00Z', 'pt-BR', translate)

    expect(english).toContain('2026')
    expect(english).not.toBe(portuguese)
    expect(formatDateTime(null, 'en-US', translate)).toBe('n/a')
    expect(formatDateTime('not-a-date', 'en-US', translate)).toBe('n/a')
  })

  it('translates object types, scopes and booleans', () => {
    expect(formatObjectType('table', translate)).toBe('Table')
    expect(formatObjectType('view', translate)).toBe('View')
    expect(formatObjectType('event', translate)).toBe('Event')
    expect(formatScope('global', translate)).toBe('Global')
    expect(formatScope('session', translate)).toBe('Session')
    expect(formatBoolean(true, translate)).toBe('Yes')
    expect(formatBoolean(false, translate)).toBe('No')
  })

  it('formats every column format and null values', () => {
    expect(formatValue(10, 'number', 'en-US', translate)).toBe('10')
    expect(formatValue(10, 'estimated', 'en-US', translate)).toBe('~10')
    expect(formatValue(1024, 'bytes', 'en-US', translate)).toBe('1 KB')
    expect(formatValue('2026-11-01T09:42:00Z', 'date', 'en-US', translate)).toContain('2026')
    expect(formatValue('table', 'objectType', 'en-US', translate)).toBe('Table')
    expect(formatValue('session', 'scope', 'en-US', translate)).toBe('Session')
    expect(formatValue(false, 'boolean', 'en-US', translate)).toBe('No')
    expect(formatValue('plain', undefined, 'en-US', translate)).toBe('plain')
    expect(formatValue(null, 'text', 'en-US', translate)).toBe('n/a')
    expect(formatValue(undefined, undefined, 'en-US', translate)).toBe('n/a')
  })

  it('uses value keys and null handling for detail fields', () => {
    expect(
      formatFieldValue({ valueKey: 'shell.workspace.values.none' }, 'en-US', translate)
    ).toBe('None')
    expect(
      formatFieldValue({ value: null, format: 'boolean' }, 'en-US', translate)
    ).toBe('n/a')
  })
})
