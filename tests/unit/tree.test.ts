import { describe, expect, it } from 'vitest'

import {
  collectIds,
  filterTree,
  flattenTree,
  parentIdOf,
  type TreeSourceNode
} from '../../src/renderer/src/ui/shell/tree'

const tree: readonly TreeSourceNode[] = [
  {
    id: 'root',
    label: 'Root',
    children: [
      {
        id: 'tables',
        label: 'Tables',
        children: [
          { id: 'customers', label: 'customers' },
          { id: 'orders', label: 'orders' }
        ]
      },
      {
        id: 'views',
        label: 'Views',
        children: [{ id: 'v_totals', label: 'v_totals' }]
      }
    ]
  }
]

function labels(nodes: readonly TreeSourceNode[]): string[] {
  return nodes.flatMap((node) => [node.label, ...labels(node.children ?? [])])
}

describe('tree filtering', () => {
  it('returns the original tree for an empty query', () => {
    expect(filterTree(tree, '   ')).toBe(tree)
  })

  it('matches labels case-insensitively and keeps the path to the match', () => {
    const filtered = filterTree(tree, 'ORDER')

    expect(labels(filtered)).toEqual(['Root', 'Tables', 'orders'])
  })

  it('keeps the whole subtree of a matching node', () => {
    const filtered = filterTree(tree, 'tables')

    expect(labels(filtered)).toEqual(['Root', 'Tables', 'customers', 'orders'])
  })

  it('drops branches without matches', () => {
    expect(filterTree(tree, 'nothing')).toEqual([])
  })
})

describe('tree flattening', () => {
  it('shows only roots when nothing is expanded', () => {
    expect(flattenTree(tree, new Set())).toEqual([
      { id: 'root', label: 'Root', depth: 0, hasChildren: true, expanded: false }
    ])
  })

  it('walks expanded nodes depth-first', () => {
    const rows = flattenTree(tree, new Set(['root', 'tables']))

    expect(rows.map((row) => [row.id, row.depth])).toEqual([
      ['root', 0],
      ['tables', 1],
      ['customers', 2],
      ['orders', 2],
      ['views', 1]
    ])
    expect(rows[4]?.expanded).toBe(false)
  })

  it('expands everything while a filter is active', () => {
    const rows = flattenTree(tree, new Set(), true)

    expect(rows.map((row) => row.id)).toEqual([
      'root',
      'tables',
      'customers',
      'orders',
      'views',
      'v_totals'
    ])
  })

  it('collects every id and finds parents by depth', () => {
    expect(collectIds(tree)).toEqual(['root', 'tables', 'customers', 'orders', 'views', 'v_totals'])

    const rows = flattenTree(tree, new Set(['root', 'tables']))
    expect(parentIdOf(rows, 0)).toBeNull()
    expect(parentIdOf(rows, 2)).toBe('tables')
    expect(parentIdOf(rows, 4)).toBe('root')
  })
})
