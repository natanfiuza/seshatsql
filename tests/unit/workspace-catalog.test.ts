import { describe, expect, it } from 'vitest'

import {
  CONNECTION,
  CONNECTION_PANELS,
  DATABASES,
  dataSampleFor,
  databaseObjectCount,
  findDatabase,
  findObject,
  objectsOfDatabase
} from '../../src/renderer/src/ui/workspace/catalog'

describe('workspace catalog', () => {
  it('exposes the simulated connection', () => {
    expect(CONNECTION.name).toBe('Seshat Lab')
    expect(CONNECTION.user).toBe('seshat')
    expect(CONNECTION.serverVersion).toBe('8.4.13')
  })

  it('contains the three expected databases', () => {
    expect(DATABASES.map((database) => database.name)).toEqual([
      'seshat_lab',
      'analytics',
      'archive'
    ])
    expect(databaseObjectCount('seshat_lab')).toBe(5)
    expect(databaseObjectCount('analytics')).toBe(3)
    expect(databaseObjectCount('archive')).toBe(1)
  })

  it('groups objects by kind', () => {
    const counts = (database: string) => {
      const objects = objectsOfDatabase(database)
      return {
        tables: objects.filter((object) => object.kind === 'table').length,
        views: objects.filter((object) => object.kind === 'view').length,
        events: objects.filter((object) => object.kind === 'event').length
      }
    }

    expect(counts('seshat_lab')).toEqual({ tables: 3, views: 1, events: 1 })
    expect(counts('analytics')).toEqual({ tables: 2, views: 1, events: 0 })
    expect(counts('archive')).toEqual({ tables: 1, views: 0, events: 0 })
  })

  it('finds databases and objects without accepting unknown names', () => {
    expect(findDatabase('analytics')?.name).toBe('analytics')
    expect(findDatabase('missing')).toBeNull()
    expect(findObject('seshat_lab', 'table', 'customers')?.name).toBe('customers')
    expect(findObject('seshat_lab', 'view', 'customers')).toBeNull()
    expect(findObject('missing', 'table', 'customers')).toBeNull()
  })

  it('gives every object metadata, structure labels and create/alter SQL', () => {
    for (const database of DATABASES) {
      for (const object of database.objects) {
        expect(object.database).toBe(database.name)
        expect(object.basic.length, object.name).toBeGreaterThan(0)
        expect(object.options.length, object.name).toBeGreaterThan(0)
        expect(object.createSql.trim().length, object.name).toBeGreaterThan(0)
        expect(object.alterSql.trim().length, object.name).toBeGreaterThan(0)
      }
    }
  })

  it('gives tables four structure grids and sample data', () => {
    for (const database of DATABASES) {
      for (const object of database.objects) {
        if (object.kind !== 'table') {
          continue
        }
        expect(object.indexes.columns.length, object.name).toBeGreaterThan(0)
        expect(object.foreignKeys.columns.length, object.name).toBeGreaterThan(0)
        expect(object.checks.columns.length, object.name).toBeGreaterThan(0)
        expect(object.partitions.columns.length, object.name).toBeGreaterThan(0)
        expect(object.data.rows.length, object.name).toBeGreaterThan(0)
      }
    }
  })

  it('gives views sample data and events none', () => {
    for (const database of DATABASES) {
      for (const object of database.objects) {
        if (object.kind === 'view') {
          expect(object.data.rows.length, object.name).toBeGreaterThan(0)
        }
        if (object.kind === 'event') {
          expect(dataSampleFor(database.name, 'table', object.name)).toBeNull()
        }
      }
    }
  })

  it('returns the sample rows used by the data workspace', () => {
    const customers = dataSampleFor('seshat_lab', 'table', 'customers')
    const view = dataSampleFor('seshat_lab', 'view', 'v_customer_totals')

    expect(customers?.rows).toHaveLength(4)
    expect(customers?.columns.map((column) => column.header)).toEqual([
      'id',
      'full_name',
      'email',
      'status',
      'notes',
      'amount'
    ])
    expect(view?.rows).toHaveLength(3)
    expect(dataSampleFor('seshat_lab', 'table', 'missing')).toBeNull()
  })

  it('provides the five connection panels with localized header keys', () => {
    expect(CONNECTION_PANELS.map((panel) => panel.id)).toEqual([
      'databases',
      'variables',
      'status',
      'processes',
      'commandStats'
    ])

    for (const panel of CONNECTION_PANELS) {
      expect(panel.labelKey.startsWith('shell.workspace.connection.')).toBe(true)
      expect(panel.grid.rows.length).toBeGreaterThan(0)
      for (const column of panel.grid.columns) {
        expect(column.headerKey?.startsWith('shell.workspace.')).toBe(true)
      }
    }
  })

  it('does not repeat object names inside a database', () => {
    for (const database of DATABASES) {
      const names = database.objects.map((object) => object.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })
})
