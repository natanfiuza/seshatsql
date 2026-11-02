import type { ObjectKind, WorkspaceTarget } from './catalog'

export type EphemeralKind = 'connection' | 'database' | ObjectKind | 'data'

export interface EphemeralTab {
  readonly id: string
  readonly kind: EphemeralKind
  readonly target: WorkspaceTarget
  readonly activeSubTab: string
}

function encode(value: string): string {
  return encodeURIComponent(value)
}

export function targetTabId(target: WorkspaceTarget): string {
  switch (target.kind) {
    case 'connection':
      return `connection:${encode(target.connectionId)}`
    case 'database':
      return `database:${encode(target.database)}`
    case 'object':
      return `${target.objectKind}:${encode(target.database)}/${encode(target.object)}`
    case 'data':
      return `data:${target.objectKind}:${encode(target.database)}/${encode(target.object)}`
  }
}

export function tabKindForTarget(target: WorkspaceTarget): EphemeralKind {
  return target.kind === 'object' ? target.objectKind : target.kind
}

export function targetsEqual(left: WorkspaceTarget, right: WorkspaceTarget): boolean {
  return targetTabId(left) === targetTabId(right)
}

export function createEphemeralTab(target: WorkspaceTarget, activeSubTab: string): EphemeralTab {
  return {
    id: targetTabId(target),
    kind: tabKindForTarget(target),
    target,
    activeSubTab
  }
}

export function openEphemeralTab(
  tabs: readonly EphemeralTab[],
  target: WorkspaceTarget,
  activeSubTab: string
): EphemeralTab[] {
  if (tabs.some((tab) => tab.id === targetTabId(target))) {
    return tabs.slice()
  }
  return [...tabs, createEphemeralTab(target, activeSubTab)]
}

export function closeEphemeralTab(
  tabs: readonly EphemeralTab[],
  id: string
): EphemeralTab[] {
  return tabs.filter((tab) => tab.id !== id)
}

export function setEphemeralSubTab(
  tabs: readonly EphemeralTab[],
  id: string,
  activeSubTab: string
): EphemeralTab[] {
  return tabs.map((tab) => (tab.id === id ? { ...tab, activeSubTab } : tab))
}

export function nextQueryNumber(tabIds: readonly string[]): number {
  let highest = 0
  for (const id of tabIds) {
    const match = /^query-(\d+)$/.exec(id)
    if (match !== null) {
      highest = Math.max(highest, Number(match[1]))
    }
  }
  return highest + 1
}

export function isQueryTabId(id: string): boolean {
  return /^query-\d+$/.test(id)
}
