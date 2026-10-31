import type { GridColumnDescriptor } from '../../grid/tsv'

/**
 * Synthetic catalog for the provisional screen. Object names and result values
 * are data, not interface text, so they are intentionally not translated.
 */
export const SAMPLE_TABLES = ['customers', 'orders', 'order_items'] as const
export const SAMPLE_VIEWS = ['v_customer_totals'] as const

export const SAMPLE_SQL = `SELECT
  c.id,
  c.full_name,
  c.status,
  c.notes,
  c.amount
FROM customers AS c
WHERE c.status = 'active'
ORDER BY c.full_name
LIMIT 100;
`

export const SAMPLE_COLUMNS: readonly GridColumnDescriptor[] = [
  { field: 'id', header: 'id', align: 'right' },
  { field: 'full_name', header: 'full_name' },
  { field: 'status', header: 'status' },
  { field: 'notes', header: 'notes' },
  { field: 'amount', header: 'amount', align: 'right' }
]

export const SAMPLE_ROWS: readonly Record<string, unknown>[] = [
  { id: 1, full_name: 'Ana Silva', status: 'active', notes: null, amount: 1250.5 },
  { id: 2, full_name: '佐藤 健', status: 'active', notes: 'Unicode: ação, ñ, 日本語', amount: 980 },
  { id: 3, full_name: 'Zoë Ångström', status: 'paused', notes: 'Second line\nwith a break', amount: 0 },
  {
    id: 4,
    full_name: 'Long text sample',
    status: 'active',
    notes: `${'x'.repeat(160)} end`,
    amount: 42
  }
]
