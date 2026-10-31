/**
 * Tab-separated serialization used by the grid copy action.
 * Values are quoted when they contain a tab, line break or double quote, which
 * is the subset of RFC 4180 that spreadsheets accept in TSV.
 */

export interface GridColumnDescriptor {
  field: string
  header: string
  /** Presentation only; the copy serializer ignores this property. */
  align?: 'left' | 'right'
}

export const NULL_DISPLAY_VALUE = 'NULL'

/** Text shown inside a grid cell. NULL is displayed as the SQL keyword. */
export function formatCellForDisplay(value: unknown): string {
  if (value === null || value === undefined) {
    return NULL_DISPLAY_VALUE
  }
  return String(value)
}

/** Text copied to the clipboard. NULL becomes an empty field. */
export function formatCellForCopy(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

export function quoteField(value: string): string {
  if (/["\t\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function serializeCell(value: unknown): string {
  return quoteField(formatCellForCopy(value))
}

export function serializeRow(columns: readonly GridColumnDescriptor[], row: Record<string, unknown>): string {
  return columns.map((column) => serializeCell(row[column.field])).join('\t')
}

export function serializeRowsWithHeaders(
  columns: readonly GridColumnDescriptor[],
  rows: readonly Record<string, unknown>[]
): string {
  const headerLine = columns.map((column) => quoteField(column.header)).join('\t')
  const lines = rows.map((row) => serializeRow(columns, row))
  return [headerLine, ...lines].join('\n')
}
