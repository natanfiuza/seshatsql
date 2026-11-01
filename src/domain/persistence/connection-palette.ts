/**
 * Fixed palette offered by the connection form. Values are stored in the
 * canonical lowercase #rrggbb form; the UI translates each entry to a name.
 */
export const CONNECTION_COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0d9488',
  '#db2777',
  '#4b5563'
] as const

export type ConnectionColor = (typeof CONNECTION_COLORS)[number]

export const DEFAULT_CONNECTION_COLOR: ConnectionColor = CONNECTION_COLORS[0]

export function isConnectionColor(value: unknown): value is ConnectionColor {
  return typeof value === 'string' && (CONNECTION_COLORS as readonly string[]).includes(value)
}
