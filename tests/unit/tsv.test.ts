import { describe, expect, it } from 'vitest'

import {
  NULL_DISPLAY_VALUE,
  formatCellForCopy,
  formatCellForDisplay,
  quoteField,
  serializeCell,
  serializeRow,
  serializeRowsWithHeaders,
  type GridColumnDescriptor
} from '../../src/renderer/src/grid/tsv'

const columns: readonly GridColumnDescriptor[] = [
  { field: 'id', header: 'id' },
  { field: 'name', header: 'full name' }
]

describe('formatCellForDisplay', () => {
  it('renders NULL for null and undefined', () => {
    expect(formatCellForDisplay(null)).toBe(NULL_DISPLAY_VALUE)
    expect(formatCellForDisplay(undefined)).toBe(NULL_DISPLAY_VALUE)
  })

  it('stringifies other values, including zero and false', () => {
    expect(formatCellForDisplay(0)).toBe('0')
    expect(formatCellForDisplay(false)).toBe('false')
    expect(formatCellForDisplay('ação, 日本語')).toBe('ação, 日本語')
  })
})

describe('formatCellForCopy', () => {
  it('keeps NULL as an empty field', () => {
    expect(formatCellForCopy(null)).toBe('')
    expect(formatCellForCopy(undefined)).toBe('')
  })
})

describe('quoteField', () => {
  it('leaves plain text untouched', () => {
    expect(quoteField('Ana Silva')).toBe('Ana Silva')
    expect(quoteField('ação, 日本語')).toBe('ação, 日本語')
  })

  it('quotes tabs, line breaks and double quotes', () => {
    expect(quoteField('a\tb')).toBe('"a\tb"')
    expect(quoteField('a\nb')).toBe('"a\nb"')
    expect(quoteField('a\rb')).toBe('"a\rb"')
    expect(quoteField('say "hi"')).toBe('"say ""hi"""')
  })
})

describe('serializeCell', () => {
  it('quotes only when the copied value needs it', () => {
    expect(serializeCell(null)).toBe('')
    expect(serializeCell('x')).toBe('x')
    expect(serializeCell('x\ny')).toBe('"x\ny"')
  })
})

describe('serializeRow', () => {
  it('joins cells with tabs and keeps empty fields for NULL', () => {
    expect(serializeRow(columns, { id: 1, name: null })).toBe('1\t')
  })
})

describe('serializeRowsWithHeaders', () => {
  it('writes the header line first and one line per row', () => {
    const text = serializeRowsWithHeaders(columns, [
      { id: 1, name: 'Ana' },
      { id: 2, name: 'Zoë' }
    ])

    expect(text).toBe('id\tfull name\n1\tAna\n2\tZoë')
  })

  it('preserves embedded tabs and line breaks inside quoted fields', () => {
    const text = serializeRowsWithHeaders(columns, [{ id: 3, name: 'two\nlines\tand a tab' }])

    expect(text).toBe('id\tfull name\n3\t"two\nlines\tand a tab"')
  })
})
