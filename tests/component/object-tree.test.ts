// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { i18n, setLocale } from '../../src/renderer/src/i18n'
import ObjectTree from '../../src/renderer/src/ui/shell/ObjectTree.vue'
import type { TreeSourceNode } from '../../src/renderer/src/ui/shell/tree'

const nodes: readonly TreeSourceNode[] = [
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

let wrapper: VueWrapper | null = null

function mountTree(): VueWrapper {
  wrapper = mount(ObjectTree, {
    attachTo: document.body,
    props: { nodes, label: 'Objects', defaultExpanded: ['root'] },
    global: { plugins: [i18n] }
  })
  return wrapper
}

function nodeIds(tree: VueWrapper): string[] {
  return tree.findAll('[role="treeitem"]').map((row) => row.attributes('data-node-id') ?? '')
}

beforeEach(() => {
  setLocale('en-US')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('ObjectTree', () => {
  it('renders the default expansion and toggles a folder', async () => {
    const tree = mountTree()
    expect(nodeIds(tree)).toEqual(['root', 'tables', 'views'])

    await tree.get('[data-node-id="tables"] .object-tree__box').trigger('click')

    expect(nodeIds(tree)).toEqual(['root', 'tables', 'customers', 'orders', 'views'])
    expect(tree.get('[data-node-id="tables"]').attributes('aria-expanded')).toBe('true')
  })

  it('filters locally while keeping the ancestors of a match', async () => {
    const tree = mountTree()

    await tree.get('.object-tree__filter').setValue('ORD')

    expect(nodeIds(tree)).toEqual(['root', 'tables', 'orders'])

    await tree.get('.object-tree__filter').setValue('missing')
    expect(nodeIds(tree)).toEqual([])
    expect(tree.text()).toContain('No matching objects')
  })

  it('supports keyboard expansion, navigation and selection', async () => {
    const tree = mountTree()
    const root = tree.get('[data-node-id="root"]')
    ;(root.element as HTMLElement).focus()

    await root.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tree.get('[data-node-id="tables"]').element)

    const tables = tree.get('[data-node-id="tables"]')
    await tables.trigger('keydown', { key: 'ArrowRight' })
    expect(tables.attributes('aria-expanded')).toBe('true')

    await tables.trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(document.activeElement).toBe(tree.get('[data-node-id="customers"]').element)

    await tree.get('[data-node-id="customers"]').trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    expect(document.activeElement).toBe(tables.element)

    await tables.trigger('keydown', { key: 'Enter' })
    expect(tables.attributes('aria-selected')).toBe('true')
  })
})
