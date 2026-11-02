import { describe, expect, it } from 'vitest'

import type { WorkspaceTarget } from '../../src/renderer/src/ui/workspace/catalog'
import {
  closeEphemeralTab,
  createEphemeralTab,
  isQueryTabId,
  nextQueryNumber,
  openEphemeralTab,
  setEphemeralSubTab,
  tabKindForTarget,
  targetTabId,
  targetsEqual
} from '../../src/renderer/src/ui/workspace/workspace-tabs'

const connection: WorkspaceTarget = { kind: 'connection', connectionId: 'seshat-lab' }
const database: WorkspaceTarget = { kind: 'database', database: 'seshat_lab' }
const table: WorkspaceTarget = {
  kind: 'object',
  database: 'seshat_lab',
  objectKind: 'table',
  object: 'customers'
}
const view: WorkspaceTarget = {
  kind: 'object',
  database: 'seshat_lab',
  objectKind: 'view',
  object: 'v_customer_totals'
}
const event: WorkspaceTarget = {
  kind: 'object',
  database: 'seshat_lab',
  objectKind: 'event',
  object: 'ev_purge_sessions'
}
const data: WorkspaceTarget = {
  kind: 'data',
  database: 'seshat_lab',
  objectKind: 'table',
  object: 'customers'
}

describe('workspace tab ids', () => {
  it('builds deterministic ids for every target', () => {
    expect(targetTabId(connection)).toBe('connection:seshat-lab')
    expect(targetTabId(database)).toBe('database:seshat_lab')
    expect(targetTabId(table)).toBe('table:seshat_lab/customers')
    expect(targetTabId(view)).toBe('view:seshat_lab/v_customer_totals')
    expect(targetTabId(event)).toBe('event:seshat_lab/ev_purge_sessions')
    expect(targetTabId(data)).toBe('data:table:seshat_lab/customers')
  })

  it('encodes names that contain reserved characters', () => {
    const odd: WorkspaceTarget = {
      kind: 'object',
      database: 'a/b',
      objectKind: 'table',
      object: 'name with spaces'
    }
    expect(targetTabId(odd)).toBe('table:a%2Fb/name%20with%20spaces')
  })

  it('compares targets by id', () => {
    expect(targetsEqual(table, { ...table })).toBe(true)
    expect(targetsEqual(table, data)).toBe(false)
  })

  it('maps targets to tab kinds', () => {
    expect(tabKindForTarget(connection)).toBe('connection')
    expect(tabKindForTarget(database)).toBe('database')
    expect(tabKindForTarget(table)).toBe('table')
    expect(tabKindForTarget(view)).toBe('view')
    expect(tabKindForTarget(event)).toBe('event')
    expect(tabKindForTarget(data)).toBe('data')
  })
})

describe('ephemeral tabs', () => {
  it('creates a tab with its default sub-tab', () => {
    const tab = createEphemeralTab(table, 'basic')
    expect(tab).toEqual({
      id: 'table:seshat_lab/customers',
      kind: 'table',
      target: table,
      activeSubTab: 'basic'
    })
  })

  it('opens new targets and deduplicates existing ones', () => {
    const first = openEphemeralTab([], table, 'basic')
    const second = openEphemeralTab(first, view, 'basic')
    const duplicate = openEphemeralTab(second, table, 'indexes')

    expect(first).toHaveLength(1)
    expect(second.map((tab) => tab.id)).toEqual([
      'table:seshat_lab/customers',
      'view:seshat_lab/v_customer_totals'
    ])
    expect(duplicate).toHaveLength(2)
    expect(duplicate[0]?.activeSubTab).toBe('basic')
  })

  it('removes only the requested tab', () => {
    const tabs = [
      createEphemeralTab(connection, 'databases'),
      createEphemeralTab(database, 'objects')
    ]
    expect(closeEphemeralTab(tabs, 'connection:seshat-lab').map((tab) => tab.id)).toEqual([
      'database:seshat_lab'
    ])
  })

  it('keeps the active sub-tab per tab', () => {
    const tabs = [
      createEphemeralTab(table, 'basic'),
      createEphemeralTab(view, 'basic')
    ]
    const updated = setEphemeralSubTab(tabs, 'view:seshat_lab/v_customer_totals', 'options')
    expect(updated[0]?.activeSubTab).toBe('basic')
    expect(updated[1]?.activeSubTab).toBe('options')
  })
})

describe('query numbering', () => {
  it('starts at one when there are no query ids', () => {
    expect(nextQueryNumber([])).toBe(1)
    expect(nextQueryNumber(['connection:seshat-lab'])).toBe(1)
  })

  it('uses the highest numeric suffix plus one', () => {
    expect(nextQueryNumber(['query-1', 'query-7', 'database:seshat_lab'])).toBe(8)
  })

  it('recognizes only query ids', () => {
    expect(isQueryTabId('query-1')).toBe(true)
    expect(isQueryTabId('query-12')).toBe(true)
    expect(isQueryTabId('query-x')).toBe(false)
    expect(isQueryTabId('data:table:seshat_lab/customers')).toBe(false)
  })
})
