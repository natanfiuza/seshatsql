/**
 * Read-only mock catalog for the workspace explorer prototype.
 *
 * Everything here is data, not interface copy: object names, SQL, comments and
 * sample rows stay in their original language. User-visible labels come from
 * the i18n catalogs. The module has no Vue, IPC or persistence dependency.
 */

export type ObjectKind = 'table' | 'view' | 'event'
export type DataObjectKind = 'table' | 'view'

export type WorkspaceTarget =
  | { readonly kind: 'connection'; readonly connectionId: string }
  | { readonly kind: 'database'; readonly database: string }
  | {
      readonly kind: 'object'
      readonly database: string
      readonly objectKind: ObjectKind
      readonly object: string
    }
  | {
      readonly kind: 'data'
      readonly database: string
      readonly object: string
      readonly objectKind: DataObjectKind
    }

export type ColumnFormat =
  | 'text'
  | 'number'
  | 'estimated'
  | 'bytes'
  | 'date'
  | 'objectType'
  | 'scope'
  | 'boolean'

export interface MockColumn {
  readonly field: string
  /** Technical column name used by data grids. */
  readonly header?: string
  /** i18n key used by metadata grids. */
  readonly headerKey?: string
  readonly align?: 'left' | 'right'
  readonly format?: ColumnFormat
  readonly width?: number
}

export interface MockGrid {
  readonly columns: readonly MockColumn[]
  readonly rows: readonly Record<string, unknown>[]
}

export interface MockField {
  readonly labelKey: string
  readonly value?: unknown
  /** i18n key used instead of a literal value (for localized enumerations). */
  readonly valueKey?: string
  readonly format?: ColumnFormat
}

export interface MockObjectBase {
  readonly kind: ObjectKind
  readonly database: string
  readonly name: string
  readonly rows: number | null
  readonly sizeBytes: number | null
  readonly createdAt: string | null
  readonly updatedAt: string | null
  readonly engine: string | null
  readonly comment: string | null
  readonly basic: readonly MockField[]
  readonly options: readonly MockField[]
  readonly createSql: string
  readonly alterSql: string
}

export interface MockTable extends MockObjectBase {
  readonly kind: 'table'
  readonly indexes: MockGrid
  readonly foreignKeys: MockGrid
  readonly checks: MockGrid
  readonly partitions: MockGrid
  readonly data: MockGrid
}

export interface MockView extends MockObjectBase {
  readonly kind: 'view'
  readonly data: MockGrid
}

export interface MockEvent extends MockObjectBase {
  readonly kind: 'event'
}

export type MockObject = MockTable | MockView | MockEvent

export interface MockDatabase {
  readonly name: string
  readonly collation: string
  readonly sizeBytes: number
  readonly objects: readonly MockObject[]
}

export interface MockConnection {
  readonly id: string
  readonly name: string
  readonly host: string
  readonly port: number
  readonly user: string
  readonly serverVersion: string
}

export interface ConnectionPanel {
  readonly id: 'databases' | 'variables' | 'status' | 'processes' | 'commandStats'
  readonly labelKey: string
  readonly grid: MockGrid
}

export const CONNECTION: MockConnection = {
  id: 'seshat-lab',
  name: 'Seshat Lab',
  host: '127.0.0.1',
  port: 3306,
  user: 'seshat',
  serverVersion: '8.4.13'
}

const customersData: MockGrid = {
  columns: [
    { field: 'id', header: 'id', align: 'right' },
    { field: 'full_name', header: 'full_name' },
    { field: 'email', header: 'email' },
    { field: 'status', header: 'status' },
    { field: 'notes', header: 'notes' },
    { field: 'amount', header: 'amount', align: 'right' }
  ],
  rows: [
    {
      id: 1,
      full_name: 'Ana Silva',
      email: 'ana.silva@example.com',
      status: 'active',
      notes: null,
      amount: 1250.5
    },
    {
      id: 2,
      full_name: '佐藤 健',
      email: 'ken.sato@example.com',
      status: 'active',
      notes: 'Unicode: ação, ñ, 日本語',
      amount: 980
    },
    {
      id: 3,
      full_name: 'Zoë Ångström',
      email: 'zoe.angstrom@example.com',
      status: 'paused',
      notes: 'Second line\nwith a break',
      amount: 0
    },
    {
      id: 4,
      full_name: 'Long text sample',
      email: 'long.text@example.com',
      status: 'active',
      notes: `${'x'.repeat(160)} end`,
      amount: 42
    }
  ]
}

const ordersData: MockGrid = {
  columns: [
    { field: 'id', header: 'id', align: 'right' },
    { field: 'customer_id', header: 'customer_id', align: 'right' },
    { field: 'status', header: 'status' },
    { field: 'total', header: 'total', align: 'right' },
    { field: 'created_at', header: 'created_at' }
  ],
  rows: [
    { id: 9001, customer_id: 1, status: 'paid', total: 1250.5, created_at: '2026-08-14 09:12:00' },
    { id: 9002, customer_id: 2, status: 'pending', total: 980, created_at: '2026-08-14 11:35:00' },
    { id: 9003, customer_id: 1, status: 'paid', total: 340.9, created_at: '2026-08-15 08:05:00' }
  ]
}

const orderItemsData: MockGrid = {
  columns: [
    { field: 'id', header: 'id', align: 'right' },
    { field: 'order_id', header: 'order_id', align: 'right' },
    { field: 'sku', header: 'sku' },
    { field: 'quantity', header: 'quantity', align: 'right' },
    { field: 'unit_price', header: 'unit_price', align: 'right' }
  ],
  rows: [
    { id: 1, order_id: 9001, sku: 'DSK-001', quantity: 2, unit_price: 420.25 },
    { id: 2, order_id: 9001, sku: 'CHR-014', quantity: 1, unit_price: 410 },
    { id: 3, order_id: 9002, sku: 'MON-027', quantity: 2, unit_price: 490 }
  ]
}

const dailyMetricsData: MockGrid = {
  columns: [
    { field: 'metric_date', header: 'metric_date' },
    { field: 'metric', header: 'metric' },
    { field: 'value', header: 'value', align: 'right' }
  ],
  rows: [
    { metric_date: '2026-10-29', metric: 'active_customers', value: 1842 },
    { metric_date: '2026-10-29', metric: 'orders', value: 124 },
    { metric_date: '2026-10-30', metric: 'active_customers', value: 1901 },
    { metric_date: '2026-10-30', metric: 'orders', value: 138 }
  ]
}

const funnelEventsData: MockGrid = {
  columns: [
    { field: 'id', header: 'id', align: 'right' },
    { field: 'session_id', header: 'session_id' },
    { field: 'step', header: 'step' },
    { field: 'occurred_at', header: 'occurred_at' }
  ],
  rows: [
    { id: 1, session_id: 's-8f2a', step: 'visit', occurred_at: '2026-10-30 10:02:11' },
    { id: 2, session_id: 's-8f2a', step: 'cart', occurred_at: '2026-10-30 10:04:37' },
    { id: 3, session_id: 's-8f2a', step: 'checkout', occurred_at: '2026-10-30 10:06:58' }
  ]
}

const auditLogData: MockGrid = {
  columns: [
    { field: 'id', header: 'id', align: 'right' },
    { field: 'actor', header: 'actor' },
    { field: 'action', header: 'action' },
    { field: 'occurred_at', header: 'occurred_at' }
  ],
  rows: [
    { id: 1, actor: 'seshat', action: 'CREATE TABLE customers', occurred_at: '2026-07-01 08:00:12' },
    { id: 2, actor: 'seshat', action: 'ALTER TABLE orders ADD INDEX', occurred_at: '2026-07-08 14:22:40' },
    { id: 3, actor: 'seshat', action: 'DROP TABLE old_orders', occurred_at: '2026-09-19 09:10:03' }
  ]
}

const customerTotalsData: MockGrid = {
  columns: [
    { field: 'customer_id', header: 'customer_id', align: 'right' },
    { field: 'full_name', header: 'full_name' },
    { field: 'order_count', header: 'order_count', align: 'right' },
    { field: 'total_amount', header: 'total_amount', align: 'right' }
  ],
  rows: [
    { customer_id: 1, full_name: 'Ana Silva', order_count: 2, total_amount: 1591.4 },
    { customer_id: 2, full_name: '佐藤 健', order_count: 1, total_amount: 980 },
    { customer_id: 3, full_name: 'Zoë Ångström', order_count: 0, total_amount: 0 }
  ]
}

const weeklyRevenueData: MockGrid = {
  columns: [
    { field: 'week_start', header: 'week_start' },
    { field: 'revenue', header: 'revenue', align: 'right' },
    { field: 'orders', header: 'orders', align: 'right' }
  ],
  rows: [
    { week_start: '2026-10-12', revenue: 18420.5, orders: 91 },
    { week_start: '2026-10-19', revenue: 20110, orders: 104 },
    { week_start: '2026-10-26', revenue: 22380.75, orders: 118 }
  ]
}

const customers: MockTable = {
  kind: 'table',
  database: 'seshat_lab',
  name: 'customers',
  rows: 1240,
  sizeBytes: 1363148,
  createdAt: '2026-06-12T13:20:00Z',
  updatedAt: '2026-10-28T17:42:00Z',
  engine: 'InnoDB',
  comment: 'Customer master data',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'customers' },
    { labelKey: 'shell.workspace.fields.database', value: 'seshat_lab' },
    { labelKey: 'shell.workspace.fields.engine', value: 'InnoDB' },
    { labelKey: 'shell.workspace.fields.collation', value: 'utf8mb4_0900_ai_ci' },
    { labelKey: 'shell.workspace.fields.charset', value: 'utf8mb4' },
    { labelKey: 'shell.workspace.fields.rows', value: 1240, format: 'estimated' },
    { labelKey: 'shell.workspace.fields.size', value: 1363148, format: 'bytes' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-06-12T13:20:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-28T17:42:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Customer master data' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.rowFormat', value: 'Dynamic' },
    { labelKey: 'shell.workspace.fields.autoIncrement', value: 1241, format: 'number' },
    { labelKey: 'shell.workspace.fields.compression', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.tablespace', value: 'innodb_file_per_table' },
    { labelKey: 'shell.workspace.fields.encryption', value: false, format: 'boolean' }
  ],
  indexes: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.indexes.name' },
      { field: 'columns', headerKey: 'shell.workspace.indexes.columns' },
      { field: 'unique', headerKey: 'shell.workspace.indexes.unique', format: 'boolean' },
      { field: 'type', headerKey: 'shell.workspace.indexes.type' }
    ],
    rows: [
      { name: 'PRIMARY', columns: 'id', unique: true, type: 'BTREE' },
      { name: 'idx_customers_status', columns: 'status', unique: false, type: 'BTREE' }
    ]
  },
  foreignKeys: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.foreignKeys.name' },
      { field: 'column', headerKey: 'shell.workspace.foreignKeys.column' },
      { field: 'referencedTable', headerKey: 'shell.workspace.foreignKeys.referencedTable' },
      { field: 'referencedColumn', headerKey: 'shell.workspace.foreignKeys.referencedColumn' },
      { field: 'onUpdate', headerKey: 'shell.workspace.foreignKeys.onUpdate' },
      { field: 'onDelete', headerKey: 'shell.workspace.foreignKeys.onDelete' }
    ],
    rows: []
  },
  checks: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.checks.name' },
      { field: 'expression', headerKey: 'shell.workspace.checks.expression' },
      { field: 'enforced', headerKey: 'shell.workspace.checks.enforced', format: 'boolean' }
    ],
    rows: [
      {
        name: 'chk_customers_amount',
        expression: '(`amount` >= 0)',
        enforced: true
      }
    ]
  },
  partitions: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.partitions.name' },
      { field: 'method', headerKey: 'shell.workspace.partitions.method' },
      { field: 'expression', headerKey: 'shell.workspace.partitions.expression' },
      { field: 'rows', headerKey: 'shell.workspace.partitions.rows', format: 'estimated', align: 'right' },
      { field: 'size', headerKey: 'shell.workspace.partitions.size', format: 'bytes', align: 'right' }
    ],
    rows: []
  },
  data: customersData,
  createSql: `CREATE TABLE \`customers\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`full_name\` varchar(160) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`status\` enum('active','paused','blocked') NOT NULL DEFAULT 'active',
  \`notes\` text,
  \`amount\` decimal(12,2) NOT NULL DEFAULT '0.00',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_customers_email\` (\`email\`),
  KEY \`idx_customers_status\` (\`status\`),
  CONSTRAINT \`chk_customers_amount\` CHECK ((\`amount\` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Customer master data';`,
  alterSql: `ALTER TABLE \`customers\`
  COMMENT = 'Customer master data',
  ALGORITHM = INPLACE;`
}

const orders: MockTable = {
  kind: 'table',
  database: 'seshat_lab',
  name: 'orders',
  rows: 8420,
  sizeBytes: 5033164,
  createdAt: '2026-06-12T13:24:00Z',
  updatedAt: '2026-10-30T08:15:00Z',
  engine: 'InnoDB',
  comment: 'Sales orders',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'orders' },
    { labelKey: 'shell.workspace.fields.database', value: 'seshat_lab' },
    { labelKey: 'shell.workspace.fields.engine', value: 'InnoDB' },
    { labelKey: 'shell.workspace.fields.collation', value: 'utf8mb4_0900_ai_ci' },
    { labelKey: 'shell.workspace.fields.charset', value: 'utf8mb4' },
    { labelKey: 'shell.workspace.fields.rows', value: 8420, format: 'estimated' },
    { labelKey: 'shell.workspace.fields.size', value: 5033164, format: 'bytes' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-06-12T13:24:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-30T08:15:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Sales orders' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.rowFormat', value: 'Dynamic' },
    { labelKey: 'shell.workspace.fields.autoIncrement', value: 9004, format: 'number' },
    { labelKey: 'shell.workspace.fields.compression', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.tablespace', value: 'innodb_file_per_table' },
    { labelKey: 'shell.workspace.fields.encryption', value: false, format: 'boolean' }
  ],
  indexes: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.indexes.name' },
      { field: 'columns', headerKey: 'shell.workspace.indexes.columns' },
      { field: 'unique', headerKey: 'shell.workspace.indexes.unique', format: 'boolean' },
      { field: 'type', headerKey: 'shell.workspace.indexes.type' }
    ],
    rows: [
      { name: 'PRIMARY', columns: 'id', unique: true, type: 'BTREE' },
      { name: 'idx_orders_customer', columns: 'customer_id', unique: false, type: 'BTREE' },
      { name: 'idx_orders_created', columns: 'created_at', unique: false, type: 'BTREE' }
    ]
  },
  foreignKeys: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.foreignKeys.name' },
      { field: 'column', headerKey: 'shell.workspace.foreignKeys.column' },
      { field: 'referencedTable', headerKey: 'shell.workspace.foreignKeys.referencedTable' },
      { field: 'referencedColumn', headerKey: 'shell.workspace.foreignKeys.referencedColumn' },
      { field: 'onUpdate', headerKey: 'shell.workspace.foreignKeys.onUpdate' },
      { field: 'onDelete', headerKey: 'shell.workspace.foreignKeys.onDelete' }
    ],
    rows: [
      {
        name: 'fk_orders_customer',
        column: 'customer_id',
        referencedTable: 'customers',
        referencedColumn: 'id',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT'
      }
    ]
  },
  checks: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.checks.name' },
      { field: 'expression', headerKey: 'shell.workspace.checks.expression' },
      { field: 'enforced', headerKey: 'shell.workspace.checks.enforced', format: 'boolean' }
    ],
    rows: []
  },
  partitions: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.partitions.name' },
      { field: 'method', headerKey: 'shell.workspace.partitions.method' },
      { field: 'expression', headerKey: 'shell.workspace.partitions.expression' },
      { field: 'rows', headerKey: 'shell.workspace.partitions.rows', format: 'estimated', align: 'right' },
      { field: 'size', headerKey: 'shell.workspace.partitions.size', format: 'bytes', align: 'right' }
    ],
    rows: []
  },
  data: ordersData,
  createSql: `CREATE TABLE \`orders\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`customer_id\` bigint unsigned NOT NULL,
  \`status\` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  \`total\` decimal(12,2) NOT NULL DEFAULT '0.00',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_orders_customer\` (\`customer_id\`),
  KEY \`idx_orders_created\` (\`created_at\`),
  CONSTRAINT \`fk_orders_customer\` FOREIGN KEY (\`customer_id\`)
    REFERENCES \`customers\` (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Sales orders';`,
  alterSql: `ALTER TABLE \`orders\`
  ADD INDEX \`idx_orders_status\` (\`status\`),
  ALGORITHM = INPLACE, LOCK = NONE;`
}

const orderItems: MockTable = {
  kind: 'table',
  database: 'seshat_lab',
  name: 'order_items',
  rows: 21090,
  sizeBytes: 10171188,
  createdAt: '2026-06-12T13:26:00Z',
  updatedAt: '2026-10-30T08:16:00Z',
  engine: 'InnoDB',
  comment: 'Order line items',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'order_items' },
    { labelKey: 'shell.workspace.fields.database', value: 'seshat_lab' },
    { labelKey: 'shell.workspace.fields.engine', value: 'InnoDB' },
    { labelKey: 'shell.workspace.fields.collation', value: 'utf8mb4_0900_ai_ci' },
    { labelKey: 'shell.workspace.fields.charset', value: 'utf8mb4' },
    { labelKey: 'shell.workspace.fields.rows', value: 21090, format: 'estimated' },
    { labelKey: 'shell.workspace.fields.size', value: 10171188, format: 'bytes' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-06-12T13:26:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-30T08:16:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Order line items' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.rowFormat', value: 'Dynamic' },
    { labelKey: 'shell.workspace.fields.autoIncrement', value: 21091, format: 'number' },
    { labelKey: 'shell.workspace.fields.compression', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.tablespace', value: 'innodb_file_per_table' },
    { labelKey: 'shell.workspace.fields.encryption', value: false, format: 'boolean' }
  ],
  indexes: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.indexes.name' },
      { field: 'columns', headerKey: 'shell.workspace.indexes.columns' },
      { field: 'unique', headerKey: 'shell.workspace.indexes.unique', format: 'boolean' },
      { field: 'type', headerKey: 'shell.workspace.indexes.type' }
    ],
    rows: [
      { name: 'PRIMARY', columns: 'id', unique: true, type: 'BTREE' },
      { name: 'idx_items_order', columns: 'order_id', unique: false, type: 'BTREE' }
    ]
  },
  foreignKeys: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.foreignKeys.name' },
      { field: 'column', headerKey: 'shell.workspace.foreignKeys.column' },
      { field: 'referencedTable', headerKey: 'shell.workspace.foreignKeys.referencedTable' },
      { field: 'referencedColumn', headerKey: 'shell.workspace.foreignKeys.referencedColumn' },
      { field: 'onUpdate', headerKey: 'shell.workspace.foreignKeys.onUpdate' },
      { field: 'onDelete', headerKey: 'shell.workspace.foreignKeys.onDelete' }
    ],
    rows: [
      {
        name: 'fk_items_order',
        column: 'order_id',
        referencedTable: 'orders',
        referencedColumn: 'id',
        onUpdate: 'RESTRICT',
        onDelete: 'CASCADE'
      }
    ]
  },
  checks: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.checks.name' },
      { field: 'expression', headerKey: 'shell.workspace.checks.expression' },
      { field: 'enforced', headerKey: 'shell.workspace.checks.enforced', format: 'boolean' }
    ],
    rows: [
      {
        name: 'chk_items_quantity',
        expression: '(`quantity` > 0)',
        enforced: true
      }
    ]
  },
  partitions: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.partitions.name' },
      { field: 'method', headerKey: 'shell.workspace.partitions.method' },
      { field: 'expression', headerKey: 'shell.workspace.partitions.expression' },
      { field: 'rows', headerKey: 'shell.workspace.partitions.rows', format: 'estimated', align: 'right' },
      { field: 'size', headerKey: 'shell.workspace.partitions.size', format: 'bytes', align: 'right' }
    ],
    rows: []
  },
  data: orderItemsData,
  createSql: `CREATE TABLE \`order_items\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`order_id\` bigint unsigned NOT NULL,
  \`sku\` varchar(40) NOT NULL,
  \`quantity\` int unsigned NOT NULL,
  \`unit_price\` decimal(12,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_items_order\` (\`order_id\`),
  CONSTRAINT \`fk_items_order\` FOREIGN KEY (\`order_id\`)
    REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`chk_items_quantity\` CHECK ((\`quantity\` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Order line items';`,
  alterSql: `ALTER TABLE \`order_items\`
  ADD COLUMN \`discount\` decimal(5,2) NOT NULL DEFAULT '0.00' AFTER \`unit_price\`,
  ALGORITHM = INSTANT;`
}

const dailyMetrics: MockTable = {
  kind: 'table',
  database: 'analytics',
  name: 'daily_metrics',
  rows: 730,
  sizeBytes: 262144,
  createdAt: '2026-01-02T00:10:00Z',
  updatedAt: '2026-10-30T00:10:00Z',
  engine: 'InnoDB',
  comment: 'Daily aggregated product metrics',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'daily_metrics' },
    { labelKey: 'shell.workspace.fields.database', value: 'analytics' },
    { labelKey: 'shell.workspace.fields.engine', value: 'InnoDB' },
    { labelKey: 'shell.workspace.fields.collation', value: 'utf8mb4_0900_ai_ci' },
    { labelKey: 'shell.workspace.fields.charset', value: 'utf8mb4' },
    { labelKey: 'shell.workspace.fields.rows', value: 730, format: 'estimated' },
    { labelKey: 'shell.workspace.fields.size', value: 262144, format: 'bytes' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-01-02T00:10:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-30T00:10:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Daily aggregated product metrics' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.rowFormat', value: 'Dynamic' },
    { labelKey: 'shell.workspace.fields.autoIncrement', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.compression', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.tablespace', value: 'innodb_file_per_table' },
    { labelKey: 'shell.workspace.fields.encryption', value: false, format: 'boolean' }
  ],
  indexes: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.indexes.name' },
      { field: 'columns', headerKey: 'shell.workspace.indexes.columns' },
      { field: 'unique', headerKey: 'shell.workspace.indexes.unique', format: 'boolean' },
      { field: 'type', headerKey: 'shell.workspace.indexes.type' }
    ],
    rows: [
      { name: 'PRIMARY', columns: 'metric_date, metric', unique: true, type: 'BTREE' },
      { name: 'idx_metrics_name', columns: 'metric', unique: false, type: 'BTREE' }
    ]
  },
  foreignKeys: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.foreignKeys.name' },
      { field: 'column', headerKey: 'shell.workspace.foreignKeys.column' },
      { field: 'referencedTable', headerKey: 'shell.workspace.foreignKeys.referencedTable' },
      { field: 'referencedColumn', headerKey: 'shell.workspace.foreignKeys.referencedColumn' },
      { field: 'onUpdate', headerKey: 'shell.workspace.foreignKeys.onUpdate' },
      { field: 'onDelete', headerKey: 'shell.workspace.foreignKeys.onDelete' }
    ],
    rows: []
  },
  checks: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.checks.name' },
      { field: 'expression', headerKey: 'shell.workspace.checks.expression' },
      { field: 'enforced', headerKey: 'shell.workspace.checks.enforced', format: 'boolean' }
    ],
    rows: [
      {
        name: 'chk_metrics_value',
        expression: '(`value` >= 0)',
        enforced: true
      }
    ]
  },
  partitions: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.partitions.name' },
      { field: 'method', headerKey: 'shell.workspace.partitions.method' },
      { field: 'expression', headerKey: 'shell.workspace.partitions.expression' },
      { field: 'rows', headerKey: 'shell.workspace.partitions.rows', format: 'estimated', align: 'right' },
      { field: 'size', headerKey: 'shell.workspace.partitions.size', format: 'bytes', align: 'right' }
    ],
    rows: [
      { name: 'p2025', method: 'RANGE', expression: 'YEAR(metric_date) = 2025', rows: 365, size: 131072 },
      { name: 'p2026', method: 'RANGE', expression: 'YEAR(metric_date) = 2026', rows: 365, size: 131072 }
    ]
  },
  data: dailyMetricsData,
  createSql: `CREATE TABLE \`daily_metrics\` (
  \`metric_date\` date NOT NULL,
  \`metric\` varchar(80) NOT NULL,
  \`value\` bigint NOT NULL,
  PRIMARY KEY (\`metric_date\`, \`metric\`),
  KEY \`idx_metrics_name\` (\`metric\`),
  CONSTRAINT \`chk_metrics_value\` CHECK ((\`value\` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
PARTITION BY RANGE (YEAR(\`metric_date\`)) (
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027)
);`,
  alterSql: `ALTER TABLE \`daily_metrics\`
  ADD PARTITION (PARTITION p2027 VALUES LESS THAN (2028)),
  ALGORITHM = INPLACE, LOCK = NONE;`
}

const funnelEvents: MockTable = {
  kind: 'table',
  database: 'analytics',
  name: 'funnel_events',
  rows: 182340,
  sizeBytes: 22020096,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-10-30T23:59:00Z',
  engine: 'InnoDB',
  comment: 'Checkout funnel events',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'funnel_events' },
    { labelKey: 'shell.workspace.fields.database', value: 'analytics' },
    { labelKey: 'shell.workspace.fields.engine', value: 'InnoDB' },
    { labelKey: 'shell.workspace.fields.collation', value: 'utf8mb4_0900_ai_ci' },
    { labelKey: 'shell.workspace.fields.charset', value: 'utf8mb4' },
    { labelKey: 'shell.workspace.fields.rows', value: 182340, format: 'estimated' },
    { labelKey: 'shell.workspace.fields.size', value: 22020096, format: 'bytes' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-02-01T10:00:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-30T23:59:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Checkout funnel events' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.rowFormat', value: 'Dynamic' },
    { labelKey: 'shell.workspace.fields.autoIncrement', value: 182341, format: 'number' },
    { labelKey: 'shell.workspace.fields.compression', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.tablespace', value: 'innodb_file_per_table' },
    { labelKey: 'shell.workspace.fields.encryption', value: false, format: 'boolean' }
  ],
  indexes: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.indexes.name' },
      { field: 'columns', headerKey: 'shell.workspace.indexes.columns' },
      { field: 'unique', headerKey: 'shell.workspace.indexes.unique', format: 'boolean' },
      { field: 'type', headerKey: 'shell.workspace.indexes.type' }
    ],
    rows: [
      { name: 'PRIMARY', columns: 'id', unique: true, type: 'BTREE' },
      { name: 'idx_funnel_session', columns: 'session_id', unique: false, type: 'BTREE' },
      { name: 'idx_funnel_occurred', columns: 'occurred_at', unique: false, type: 'BTREE' }
    ]
  },
  foreignKeys: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.foreignKeys.name' },
      { field: 'column', headerKey: 'shell.workspace.foreignKeys.column' },
      { field: 'referencedTable', headerKey: 'shell.workspace.foreignKeys.referencedTable' },
      { field: 'referencedColumn', headerKey: 'shell.workspace.foreignKeys.referencedColumn' },
      { field: 'onUpdate', headerKey: 'shell.workspace.foreignKeys.onUpdate' },
      { field: 'onDelete', headerKey: 'shell.workspace.foreignKeys.onDelete' }
    ],
    rows: []
  },
  checks: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.checks.name' },
      { field: 'expression', headerKey: 'shell.workspace.checks.expression' },
      { field: 'enforced', headerKey: 'shell.workspace.checks.enforced', format: 'boolean' }
    ],
    rows: []
  },
  partitions: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.partitions.name' },
      { field: 'method', headerKey: 'shell.workspace.partitions.method' },
      { field: 'expression', headerKey: 'shell.workspace.partitions.expression' },
      { field: 'rows', headerKey: 'shell.workspace.partitions.rows', format: 'estimated', align: 'right' },
      { field: 'size', headerKey: 'shell.workspace.partitions.size', format: 'bytes', align: 'right' }
    ],
    rows: []
  },
  data: funnelEventsData,
  createSql: `CREATE TABLE \`funnel_events\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`session_id\` varchar(64) NOT NULL,
  \`step\` enum('visit','cart','checkout','paid') NOT NULL,
  \`occurred_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_funnel_session\` (\`session_id\`),
  KEY \`idx_funnel_occurred\` (\`occurred_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Checkout funnel events';`,
  alterSql: `ALTER TABLE \`funnel_events\`
  MODIFY COLUMN \`step\` enum('visit','cart','checkout','paid','abandoned') NOT NULL,
  ALGORITHM = INSTANT;`
}

const auditLog: MockTable = {
  kind: 'table',
  database: 'archive',
  name: 'audit_log',
  rows: 912400,
  sizeBytes: 67108864,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2026-10-29T12:00:00Z',
  engine: 'InnoDB',
  comment: 'Archived audit trail',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'audit_log' },
    { labelKey: 'shell.workspace.fields.database', value: 'archive' },
    { labelKey: 'shell.workspace.fields.engine', value: 'InnoDB' },
    { labelKey: 'shell.workspace.fields.collation', value: 'utf8mb4_0900_ai_ci' },
    { labelKey: 'shell.workspace.fields.charset', value: 'utf8mb4' },
    { labelKey: 'shell.workspace.fields.rows', value: 912400, format: 'estimated' },
    { labelKey: 'shell.workspace.fields.size', value: 67108864, format: 'bytes' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2024-01-01T00:00:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-29T12:00:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Archived audit trail' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.rowFormat', value: 'Compressed' },
    { labelKey: 'shell.workspace.fields.autoIncrement', value: 912401, format: 'number' },
    { labelKey: 'shell.workspace.fields.compression', value: 'zlib' },
    { labelKey: 'shell.workspace.fields.tablespace', value: 'innodb_file_per_table' },
    { labelKey: 'shell.workspace.fields.encryption', value: false, format: 'boolean' }
  ],
  indexes: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.indexes.name' },
      { field: 'columns', headerKey: 'shell.workspace.indexes.columns' },
      { field: 'unique', headerKey: 'shell.workspace.indexes.unique', format: 'boolean' },
      { field: 'type', headerKey: 'shell.workspace.indexes.type' }
    ],
    rows: [
      { name: 'PRIMARY', columns: 'id', unique: true, type: 'BTREE' },
      { name: 'idx_audit_occurred', columns: 'occurred_at', unique: false, type: 'BTREE' }
    ]
  },
  foreignKeys: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.foreignKeys.name' },
      { field: 'column', headerKey: 'shell.workspace.foreignKeys.column' },
      { field: 'referencedTable', headerKey: 'shell.workspace.foreignKeys.referencedTable' },
      { field: 'referencedColumn', headerKey: 'shell.workspace.foreignKeys.referencedColumn' },
      { field: 'onUpdate', headerKey: 'shell.workspace.foreignKeys.onUpdate' },
      { field: 'onDelete', headerKey: 'shell.workspace.foreignKeys.onDelete' }
    ],
    rows: []
  },
  checks: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.checks.name' },
      { field: 'expression', headerKey: 'shell.workspace.checks.expression' },
      { field: 'enforced', headerKey: 'shell.workspace.checks.enforced', format: 'boolean' }
    ],
    rows: []
  },
  partitions: {
    columns: [
      { field: 'name', headerKey: 'shell.workspace.partitions.name' },
      { field: 'method', headerKey: 'shell.workspace.partitions.method' },
      { field: 'expression', headerKey: 'shell.workspace.partitions.expression' },
      { field: 'rows', headerKey: 'shell.workspace.partitions.rows', format: 'estimated', align: 'right' },
      { field: 'size', headerKey: 'shell.workspace.partitions.size', format: 'bytes', align: 'right' }
    ],
    rows: [
      { name: 'p2024', method: 'RANGE', expression: 'YEAR(occurred_at) = 2024', rows: 291000, size: 20971520 },
      { name: 'p2025', method: 'RANGE', expression: 'YEAR(occurred_at) = 2025', rows: 361400, size: 26214400 },
      { name: 'p2026', method: 'RANGE', expression: 'YEAR(occurred_at) = 2026', rows: 260000, size: 19922944 }
    ]
  },
  data: auditLogData,
  createSql: `CREATE TABLE \`audit_log\` (
  \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
  \`actor\` varchar(80) NOT NULL,
  \`action\` varchar(255) NOT NULL,
  \`occurred_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_audit_occurred\` (\`occurred_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Archived audit trail'
PARTITION BY RANGE (YEAR(\`occurred_at\`)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027)
);`,
  alterSql: `ALTER TABLE \`audit_log\`
  ADD PARTITION (PARTITION p2027 VALUES LESS THAN (2028)),
  ALGORITHM = INPLACE, LOCK = NONE;`
}

const customerTotalsView: MockView = {
  kind: 'view',
  database: 'seshat_lab',
  name: 'v_customer_totals',
  rows: null,
  sizeBytes: null,
  createdAt: '2026-07-02T10:00:00Z',
  updatedAt: '2026-10-12T09:30:00Z',
  engine: null,
  comment: 'Customer order totals',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'v_customer_totals' },
    { labelKey: 'shell.workspace.fields.database', value: 'seshat_lab' },
    { labelKey: 'shell.workspace.fields.definer', value: 'seshat@localhost' },
    { labelKey: 'shell.workspace.fields.security', valueKey: 'shell.workspace.values.definer' },
    { labelKey: 'shell.workspace.fields.checkOption', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-07-02T10:00:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-12T09:30:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Customer order totals' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.algorithm', value: 'UNDEFINED' },
    { labelKey: 'shell.workspace.fields.security', valueKey: 'shell.workspace.values.definer' },
    { labelKey: 'shell.workspace.fields.checkOption', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.updatable', value: false, format: 'boolean' }
  ],
  data: customerTotalsData,
  createSql: `CREATE ALGORITHM=UNDEFINED DEFINER=\`seshat\`@\`localhost\`
SQL SECURITY DEFINER VIEW \`v_customer_totals\` AS
SELECT
  c.id AS customer_id,
  c.full_name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total), 0) AS total_amount
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.full_name;`,
  alterSql: `ALTER ALGORITHM=UNDEFINED DEFINER=\`seshat\`@\`localhost\`
SQL SECURITY DEFINER VIEW \`v_customer_totals\` AS
SELECT
  c.id AS customer_id,
  c.full_name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total), 0) AS total_amount
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
GROUP BY c.id, c.full_name;`
}

const weeklyRevenueView: MockView = {
  kind: 'view',
  database: 'analytics',
  name: 'v_weekly_revenue',
  rows: null,
  sizeBytes: null,
  createdAt: '2026-03-01T11:15:00Z',
  updatedAt: '2026-10-27T18:40:00Z',
  engine: null,
  comment: 'Weekly revenue rollup',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'v_weekly_revenue' },
    { labelKey: 'shell.workspace.fields.database', value: 'analytics' },
    { labelKey: 'shell.workspace.fields.definer', value: 'seshat@localhost' },
    { labelKey: 'shell.workspace.fields.security', valueKey: 'shell.workspace.values.definer' },
    { labelKey: 'shell.workspace.fields.checkOption', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-03-01T11:15:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-27T18:40:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Weekly revenue rollup' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.algorithm', value: 'UNDEFINED' },
    { labelKey: 'shell.workspace.fields.security', valueKey: 'shell.workspace.values.definer' },
    { labelKey: 'shell.workspace.fields.checkOption', valueKey: 'shell.workspace.values.none' },
    { labelKey: 'shell.workspace.fields.updatable', value: false, format: 'boolean' }
  ],
  data: weeklyRevenueData,
  createSql: `CREATE ALGORITHM=UNDEFINED DEFINER=\`seshat\`@\`localhost\`
SQL SECURITY DEFINER VIEW \`v_weekly_revenue\` AS
SELECT
  DATE_FORMAT(o.created_at, '%x-%v') AS week_start,
  SUM(o.total) AS revenue,
  COUNT(*) AS orders
FROM seshat_lab.orders AS o
WHERE o.status = 'paid'
GROUP BY DATE_FORMAT(o.created_at, '%x-%v');`,
  alterSql: `ALTER ALGORITHM=UNDEFINED DEFINER=\`seshat\`@\`localhost\`
SQL SECURITY DEFINER VIEW \`v_weekly_revenue\` AS
SELECT
  DATE_FORMAT(o.created_at, '%x-%v') AS week_start,
  SUM(o.total) AS revenue,
  COUNT(*) AS orders
FROM seshat_lab.orders AS o
WHERE o.status = 'paid'
GROUP BY DATE_FORMAT(o.created_at, '%x-%v');`
}

const purgeSessionsEvent: MockEvent = {
  kind: 'event',
  database: 'seshat_lab',
  name: 'ev_purge_sessions',
  rows: null,
  sizeBytes: null,
  createdAt: '2026-08-04T15:20:00Z',
  updatedAt: '2026-10-25T07:00:00Z',
  engine: null,
  comment: 'Purge expired application sessions',
  basic: [
    { labelKey: 'shell.workspace.fields.name', value: 'ev_purge_sessions' },
    { labelKey: 'shell.workspace.fields.database', value: 'seshat_lab' },
    { labelKey: 'shell.workspace.fields.definer', value: 'seshat@localhost' },
    { labelKey: 'shell.workspace.fields.status', valueKey: 'shell.workspace.values.enabled' },
    { labelKey: 'shell.workspace.fields.type', valueKey: 'shell.workspace.values.recurring' },
    { labelKey: 'shell.workspace.fields.createdAt', value: '2026-08-04T15:20:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.updatedAt', value: '2026-10-25T07:00:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.comment', value: 'Purge expired application sessions' }
  ],
  options: [
    { labelKey: 'shell.workspace.fields.schedule', value: 'EVERY 1 DAY' },
    { labelKey: 'shell.workspace.fields.starts', value: '2026-08-05T03:00:00Z', format: 'date' },
    { labelKey: 'shell.workspace.fields.ends', valueKey: 'shell.workspace.values.never' },
    { labelKey: 'shell.workspace.fields.onCompletion', valueKey: 'shell.workspace.values.preserve' },
    { labelKey: 'shell.workspace.fields.lastExecuted', value: '2026-10-31T03:00:00Z', format: 'date' }
  ],
  createSql: `CREATE DEFINER=\`seshat\`@\`localhost\` EVENT \`ev_purge_sessions\`
ON SCHEDULE EVERY 1 DAY
STARTS '2026-08-05 03:00:00'
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Purge expired application sessions'
DO
  DELETE FROM seshat_lab.app_sessions WHERE expires_at < NOW();`,
  alterSql: `ALTER DEFINER=\`seshat\`@\`localhost\` EVENT \`ev_purge_sessions\`
ON SCHEDULE EVERY 1 DAY
STARTS '2026-08-05 03:00:00'
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Purge expired application sessions'
DO
  DELETE FROM seshat_lab.app_sessions WHERE expires_at < NOW();`
}

export const DATABASES: readonly MockDatabase[] = [
  {
    name: 'seshat_lab',
    collation: 'utf8mb4_0900_ai_ci',
    sizeBytes: 16777216,
    objects: [customers, orders, orderItems, customerTotalsView, purgeSessionsEvent]
  },
  {
    name: 'analytics',
    collation: 'utf8mb4_0900_ai_ci',
    sizeBytes: 23068672,
    objects: [dailyMetrics, funnelEvents, weeklyRevenueView]
  },
  {
    name: 'archive',
    collation: 'utf8mb4_0900_ai_ci',
    sizeBytes: 67108864,
    objects: [auditLog]
  }
]

const databaseRows = DATABASES.map((database) => ({
  name: database.name,
  tables: database.objects.filter((object) => object.kind === 'table').length,
  views: database.objects.filter((object) => object.kind === 'view').length,
  size: database.sizeBytes,
  collation: database.collation
}))

const variablesRows = [
  { variable: 'version', value: CONNECTION.serverVersion, scope: 'global' },
  { variable: 'character_set_server', value: 'utf8mb4', scope: 'global' },
  { variable: 'collation_server', value: 'utf8mb4_0900_ai_ci', scope: 'global' },
  { variable: 'max_connections', value: '151', scope: 'global' },
  { variable: 'sql_mode', value: 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION', scope: 'session' },
  { variable: 'time_zone', value: 'SYSTEM', scope: 'session' },
  { variable: 'transaction_isolation', value: 'REPEATABLE-READ', scope: 'session' }
]

const statusRows = [
  { variable: 'Uptime', value: '48211' },
  { variable: 'Threads_connected', value: '4' },
  { variable: 'Questions', value: '1204' },
  { variable: 'Slow_queries', value: '2' },
  { variable: 'Innodb_buffer_pool_reads', value: '318' },
  { variable: 'Innodb_buffer_pool_read_requests', value: '184220' }
]

const processRows = [
  {
    id: 42,
    user: 'seshat',
    host: '127.0.0.1:54012',
    database: 'seshat_lab',
    command: 'Query',
    time: 0,
    state: 'executing',
    info: 'SELECT * FROM customers WHERE status = ?'
  },
  {
    id: 43,
    user: 'report',
    host: '10.0.0.18:61204',
    database: 'analytics',
    command: 'Sleep',
    time: 18,
    state: 'waiting',
    info: null
  },
  {
    id: 44,
    user: 'seshat',
    host: '127.0.0.1:54044',
    database: 'seshat_lab',
    command: 'Query',
    time: 1,
    state: 'Sending data',
    info: 'SELECT COUNT(*) FROM orders'
  },
  {
    id: 45,
    user: 'backup',
    host: '10.0.0.22:49810',
    database: 'archive',
    command: 'Daemon',
    time: 312,
    state: 'waiting',
    info: null
  }
]

const commandStatsRows = [
  { command: 'SELECT', total: 5420, perHour: 405, perSecond: 0.11 },
  { command: 'INSERT', total: 312, perHour: 23, perSecond: 0.01 },
  { command: 'UPDATE', total: 98, perHour: 7, perSecond: 0 },
  { command: 'DELETE', total: 21, perHour: 2, perSecond: 0 },
  { command: 'COMMIT', total: 410, perHour: 31, perSecond: 0.01 },
  { command: 'ROLLBACK', total: 3, perHour: 0, perSecond: 0 }
]

export const CONNECTION_PANELS: readonly ConnectionPanel[] = [
  {
    id: 'databases',
    labelKey: 'shell.workspace.connection.databases',
    grid: {
      columns: [
        { field: 'name', headerKey: 'shell.workspace.connection.databasesGrid.name' },
        { field: 'tables', headerKey: 'shell.workspace.connection.databasesGrid.tables', align: 'right', format: 'number' },
        { field: 'views', headerKey: 'shell.workspace.connection.databasesGrid.views', align: 'right', format: 'number' },
        { field: 'size', headerKey: 'shell.workspace.connection.databasesGrid.size', align: 'right', format: 'bytes' },
        { field: 'collation', headerKey: 'shell.workspace.connection.databasesGrid.collation' }
      ],
      rows: databaseRows
    }
  },
  {
    id: 'variables',
    labelKey: 'shell.workspace.connection.variables',
    grid: {
      columns: [
        { field: 'variable', headerKey: 'shell.workspace.connection.variablesGrid.variable' },
        { field: 'value', headerKey: 'shell.workspace.connection.variablesGrid.value' },
        { field: 'scope', headerKey: 'shell.workspace.connection.variablesGrid.scope', format: 'scope' }
      ],
      rows: variablesRows
    }
  },
  {
    id: 'status',
    labelKey: 'shell.workspace.connection.status',
    grid: {
      columns: [
        { field: 'variable', headerKey: 'shell.workspace.connection.statusGrid.variable' },
        { field: 'value', headerKey: 'shell.workspace.connection.statusGrid.value' }
      ],
      rows: statusRows
    }
  },
  {
    id: 'processes',
    labelKey: 'shell.workspace.connection.processes',
    grid: {
      columns: [
        { field: 'id', headerKey: 'shell.workspace.connection.processesGrid.id', align: 'right', format: 'number' },
        { field: 'user', headerKey: 'shell.workspace.connection.processesGrid.user' },
        { field: 'host', headerKey: 'shell.workspace.connection.processesGrid.host' },
        { field: 'database', headerKey: 'shell.workspace.connection.processesGrid.database' },
        { field: 'command', headerKey: 'shell.workspace.connection.processesGrid.command' },
        { field: 'time', headerKey: 'shell.workspace.connection.processesGrid.time', align: 'right', format: 'number' },
        { field: 'state', headerKey: 'shell.workspace.connection.processesGrid.state' },
        { field: 'info', headerKey: 'shell.workspace.connection.processesGrid.info' }
      ],
      rows: processRows
    }
  },
  {
    id: 'commandStats',
    labelKey: 'shell.workspace.connection.commandStats',
    grid: {
      columns: [
        { field: 'command', headerKey: 'shell.workspace.connection.commandStatsGrid.command' },
        { field: 'total', headerKey: 'shell.workspace.connection.commandStatsGrid.total', align: 'right', format: 'number' },
        { field: 'perHour', headerKey: 'shell.workspace.connection.commandStatsGrid.perHour', align: 'right', format: 'number' },
        { field: 'perSecond', headerKey: 'shell.workspace.connection.commandStatsGrid.perSecond', align: 'right', format: 'number' }
      ],
      rows: commandStatsRows
    }
  }
]

export function findDatabase(name: string): MockDatabase | null {
  return DATABASES.find((database) => database.name === name) ?? null
}

export function findObject(
  database: string,
  kind: ObjectKind,
  name: string
): MockObject | null {
  return (
    findDatabase(database)?.objects.find((object) => object.kind === kind && object.name === name) ??
    null
  )
}

export function objectsOfDatabase(database: string): readonly MockObject[] {
  return findDatabase(database)?.objects ?? []
}

export function dataSampleFor(
  database: string,
  objectKind: DataObjectKind,
  name: string
): MockGrid | null {
  const object = findObject(database, objectKind, name)
  return object !== null && object.kind !== 'event' ? object.data : null
}

export function databaseObjectCount(database: string): number {
  return objectsOfDatabase(database).length
}
