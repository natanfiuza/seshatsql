// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- the stubs replace grid and editor children */
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n, setLocale } from '../../src/renderer/src/i18n'
import { findObject } from '../../src/renderer/src/ui/workspace/catalog'
import ConnectionWorkspace from '../../src/renderer/src/ui/workspace/ConnectionWorkspace.vue'
import DatabaseWorkspace from '../../src/renderer/src/ui/workspace/DatabaseWorkspace.vue'
import DataWorkspace from '../../src/renderer/src/ui/workspace/DataWorkspace.vue'
import ObjectWorkspace from '../../src/renderer/src/ui/workspace/ObjectWorkspace.vue'

vi.mock('../../src/renderer/src/grid/ResultGrid.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'ResultGridStub',
      props: {
        columns: { type: Array, required: true },
        rows: { type: Array, required: true },
        theme: { type: String, required: true },
        locale: { type: String, required: true },
        showRowNumbers: { type: Boolean, default: true },
        testId: { type: String, default: 'result-grid' }
      },
      emits: ['copy', 'rowClick', 'rowDoubleClick'],
      setup(props, { emit }) {
        return () =>
          h(
            'div',
            { 'data-testid': props.testId },
            [
              h(
                'div',
                { 'data-testid': 'grid-headers' },
                (props.columns as Array<{ header: string }>).map((column) => column.header).join('|')
              ),
              ...(props.rows as Array<Record<string, unknown>>).map((row, index) =>
                h('button', {
                  'data-testid': `grid-row-${index}`,
                  onClick: () => emit('rowClick', row),
                  onDblclick: () => emit('rowDoubleClick', row)
                })
              )
            ]
          )
      }
    })
  }
})

vi.mock('../../src/renderer/src/editor/MonacoEditor.vue', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    default: defineComponent({
      name: 'MonacoEditorStub',
      props: {
        modelId: { type: String, required: true },
        value: { type: String, required: true },
        theme: { type: String, required: true },
        locale: { type: String, required: true },
        readOnly: { type: Boolean, default: false },
        ariaLabel: { type: String, default: '' },
        testId: { type: String, default: 'monaco-editor' }
      },
      setup(props) {
        return () =>
          h('div', {
            'data-testid': props.testId,
            'data-readonly': String(props.readOnly),
            'data-value': props.value,
            'aria-label': props.ariaLabel
          })
      }
    })
  }
})

const mounted: VueWrapper[] = []

function track<T extends VueWrapper>(wrapper: T): T {
  mounted.push(wrapper)
  return wrapper
}

function mountConnection(activeSubTab = 'databases'): VueWrapper {
  return track(
    mount(ConnectionWorkspace, {
      props: { activeSubTab, theme: 'light', locale: 'en-US' },
      global: { plugins: [i18n] }
    })
  )
}

beforeEach(() => {
  setLocale('en-US')
})

afterEach(() => {
  while (mounted.length > 0) {
    mounted.pop()?.unmount()
  }
  vi.useRealTimers()
})

describe('ConnectionWorkspace', () => {
  it('renders five counted sub-tabs and the databases grid columns', async () => {
    const view = mountConnection()
    const tabs = view.findAll('[role="tab"]')

    expect(tabs).toHaveLength(5)
    expect(tabs.map((tab) => tab.text())).toEqual([
      'Databases (3)',
      'Variables (7)',
      'Status (6)',
      'Processes (4)',
      'Command statistics (6)'
    ])
    expect(view.get('[data-testid="grid-headers"]').text()).toBe(
      'Name|Tables|Views|Size|Collation'
    )

    await tabs[1]?.trigger('click')
    expect(view.emitted('update:activeSubTab')?.[0]).toEqual(['variables'])
  })

  it('switches the grid when the active panel changes', () => {
    const view = mountConnection('processes')

    expect(view.get('[data-testid="grid-headers"]').text()).toBe(
      'ID|User|Host|Database|Command|Time|State|Info'
    )
  })
})

describe('DatabaseWorkspace', () => {
  it('lists eight columns and opens structure on a delayed single click', async () => {
    vi.useFakeTimers()
    const view = track(
      mount(DatabaseWorkspace, {
        props: { database: 'seshat_lab', theme: 'light', locale: 'en-US' },
        global: { plugins: [i18n] }
      })
    )

    expect(view.get('.database-view__title').text()).toBe('Database: seshat_lab')
    expect(view.get('[data-testid="grid-headers"]').text()).toBe(
      'Name|Rows|Size|Created at|Updated at|Engine|Comment|Type'
    )
    expect(view.findAll('[data-testid^="grid-row-"]')).toHaveLength(5)

    await view.get('[data-testid="grid-row-0"]').trigger('click')
    expect(view.emitted('openObject')).toBeUndefined()
    vi.advanceTimersByTime(250)
    expect(view.emitted('openObject')?.[0]).toEqual([
      { kind: 'object', database: 'seshat_lab', objectKind: 'table', object: 'customers' }
    ])
  })

  it('opens data on double click without opening structure', async () => {
    vi.useFakeTimers()
    const view = track(
      mount(DatabaseWorkspace, {
        props: { database: 'seshat_lab', theme: 'light', locale: 'en-US' },
        global: { plugins: [i18n] }
      })
    )

    await view.get('[data-testid="grid-row-0"]').trigger('click')
    await view.get('[data-testid="grid-row-0"]').trigger('dblclick')
    vi.advanceTimersByTime(250)

    expect(view.emitted('openObject')).toBeUndefined()
    expect(view.emitted('openData')?.[0]).toEqual([
      { kind: 'data', database: 'seshat_lab', objectKind: 'table', object: 'customers' }
    ])
  })

  it('clears the pending click when unmounted', async () => {
    vi.useFakeTimers()
    const view = track(
      mount(DatabaseWorkspace, {
        props: { database: 'seshat_lab', theme: 'light', locale: 'en-US' },
        global: { plugins: [i18n] }
      })
    )

    await view.get('[data-testid="grid-row-0"]').trigger('click')
    view.unmount()
    vi.advanceTimersByTime(250)

    expect(view.emitted('openObject')).toBeUndefined()
  })
})

describe('ObjectWorkspace', () => {
  const table = findObject('seshat_lab', 'table', 'customers')
  const view = findObject('seshat_lab', 'view', 'v_customer_totals')
  const event = findObject('seshat_lab', 'event', 'ev_purge_sessions')

  function mountObject(
    object: NonNullable<ReturnType<typeof findObject>>,
    activeSubTab = 'basic'
  ): VueWrapper {
    return track(
      mount(ObjectWorkspace, {
        props: { object, activeSubTab, theme: 'light', locale: 'en-US' },
        global: { plugins: [i18n] }
      })
    )
  }

  it('renders eight table sections and a readable structure grid', async () => {
    if (table === null) {
      throw new Error('Missing mock table')
    }
    const object = mountObject(table)
    const tabs = object.findAll('.tabstrip--secondary [role="tab"]')

    expect(tabs).toHaveLength(8)
    expect(tabs.map((tab) => tab.text())).toEqual([
      'Basic',
      'Options',
      'Indexes',
      'Foreign keys',
      'CHECK constraints',
      'Partitions',
      'CREATE code',
      'ALTER code'
    ])
    expect(object.get('.object-view__title').text()).toBe('Table: customers')

    await tabs[2]?.trigger('click')
    expect(object.emitted('update:activeSubTab')?.[0]).toEqual(['indexes'])

    const indexes = mountObject(table, 'indexes')
    expect(indexes.find('[data-testid="object-grid-indexes"]').exists()).toBe(true)

    const create = mountObject(table, 'createSql')
    expect(create.get('[data-testid="object-create-code"]').attributes('data-readonly')).toBe('true')
    expect(create.get('[data-testid="object-create-code"]').attributes('data-value')).toContain(
      'CREATE TABLE'
    )
  })

  it('opens data for a table and a view', async () => {
    if (table === null || view === null) {
      throw new Error('Missing mock object')
    }
    const tableView = mountObject(table)
    await tableView.get('.object-view__open-data').trigger('click')
    expect(tableView.emitted('openData')?.[0]).toEqual([
      { kind: 'data', database: 'seshat_lab', objectKind: 'table', object: 'customers' }
    ])

    const viewWorkspace = mountObject(view)
    const tabs = viewWorkspace.findAll('.tabstrip--secondary [role="tab"]')
    expect(tabs).toHaveLength(4)
    expect(viewWorkspace.get('.object-view__title').text()).toBe('View: v_customer_totals')
    await viewWorkspace.get('.object-view__open-data').trigger('click')
    expect(viewWorkspace.emitted('openData')?.[0]).toEqual([
      {
        kind: 'data',
        database: 'seshat_lab',
        objectKind: 'view',
        object: 'v_customer_totals'
      }
    ])
  })

  it('keeps four event sections and hides data', () => {
    if (event === null) {
      throw new Error('Missing mock event')
    }
    const object = mountObject(event)

    expect(object.findAll('.tabstrip--secondary [role="tab"]')).toHaveLength(4)
    expect(object.get('.object-view__title').text()).toBe('Event: ev_purge_sessions')
    expect(object.find('.object-view__open-data').exists()).toBe(false)
  })
})

describe('DataWorkspace', () => {
  it('renders the sample rows for the opened object', () => {
    const view = track(
      mount(DataWorkspace, {
        props: {
          database: 'seshat_lab',
          objectKind: 'table',
          objectName: 'customers',
          theme: 'light',
          locale: 'en-US'
        },
        global: { plugins: [i18n] }
      })
    )

    expect(view.get('.data-view__title').text()).toBe('Data: customers')
    expect(view.find('[data-testid="data-grid"]').exists()).toBe(true)
    expect(view.findAll('[data-testid^="grid-row-"]').length).toBeGreaterThan(0)
  })
})
