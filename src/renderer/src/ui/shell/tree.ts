/**
 * Pure tree helpers for ObjectTree: filtering that keeps the path to every
 * match, flattening for keyboard navigation and id collection for the initial
 * expansion state.
 */
export interface TreeSourceNode {
  readonly id: string
  readonly label: string
  readonly children?: readonly TreeSourceNode[]
}

export interface TreeRow {
  readonly id: string
  readonly label: string
  readonly depth: number
  readonly hasChildren: boolean
  readonly expanded: boolean
}

function isNode(node: TreeSourceNode | null): node is TreeSourceNode {
  return node !== null
}

function filterNode(node: TreeSourceNode, needle: string): TreeSourceNode | null {
  // A matching node keeps its whole subtree; otherwise only matching branches
  // survive, together with the ancestors that lead to them.
  if (node.label.toLowerCase().includes(needle)) {
    return node
  }
  const children = (node.children ?? []).map((child) => filterNode(child, needle)).filter(isNode)
  if (children.length === 0) {
    return null
  }
  return { ...node, children }
}

export function filterTree(nodes: readonly TreeSourceNode[], query: string): readonly TreeSourceNode[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') {
    return nodes
  }
  return nodes.map((node) => filterNode(node, needle)).filter(isNode)
}

/**
 * Flattens the visible rows. `expandAll` is used while a filter is active so
 * every match is reachable without extra clicks.
 */
export function flattenTree(
  nodes: readonly TreeSourceNode[],
  expanded: ReadonlySet<string>,
  expandAll = false
): TreeRow[] {
  const rows: TreeRow[] = []

  function walk(list: readonly TreeSourceNode[], depth: number): void {
    for (const node of list) {
      const hasChildren = (node.children?.length ?? 0) > 0
      const isExpanded = hasChildren && (expandAll || expanded.has(node.id))
      rows.push({ id: node.id, label: node.label, depth, hasChildren, expanded: isExpanded })
      if (isExpanded) {
        walk(node.children ?? [], depth + 1)
      }
    }
  }

  walk(nodes, 0)
  return rows
}

export function collectIds(nodes: readonly TreeSourceNode[]): string[] {
  const ids: string[] = []

  function walk(list: readonly TreeSourceNode[]): void {
    for (const node of list) {
      ids.push(node.id)
      walk(node.children ?? [])
    }
  }

  walk(nodes)
  return ids
}

/** Id of the previous row with a shallower depth, or null at the root. */
export function parentIdOf(rows: readonly TreeRow[], index: number): string | null {
  const row = rows[index]
  if (row === undefined) {
    return null
  }
  for (let candidate = index - 1; candidate >= 0; candidate -= 1) {
    const other = rows[candidate]
    if (other !== undefined && other.depth < row.depth) {
      return other.depth === row.depth - 1 ? other.id : null
    }
  }
  return null
}
