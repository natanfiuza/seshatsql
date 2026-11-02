<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ObjectTree from '../shell/ObjectTree.vue'
import type { TreeSourceNode } from '../shell/tree'
import { CONNECTION, DATABASES, type ObjectKind, type WorkspaceTarget } from '../workspace/catalog'
import { targetTabId } from '../workspace/workspace-tabs'

const emit = defineEmits<{ activate: [target: WorkspaceTarget] }>()

const { t } = useI18n()

const folders: ReadonlyArray<{
  kind: ObjectKind
  nodeKey: string
  labelKey: string
}> = [
  { kind: 'table', nodeKey: 'tables', labelKey: 'shell.tree.tables' },
  { kind: 'view', nodeKey: 'views', labelKey: 'shell.tree.views' },
  { kind: 'event', nodeKey: 'events', labelKey: 'shell.tree.events' }
]

function folderId(database: string, nodeKey: string): string {
  return `folder:${database}:${nodeKey}`
}

const tree = computed<{
  nodes: TreeSourceNode[]
  targets: ReadonlyMap<string, WorkspaceTarget>
}>(() => {
  const targets = new Map<string, WorkspaceTarget>()

  const databases = DATABASES.map((database) => {
    const databaseTarget: WorkspaceTarget = { kind: 'database', database: database.name }
    const databaseId = targetTabId(databaseTarget)
    targets.set(databaseId, databaseTarget)

    const groups = folders.map((folder) => {
      const objects = database.objects.filter((object) => object.kind === folder.kind)
      const children = objects.map((object) => {
        const target: WorkspaceTarget = {
          kind: 'object',
          database: database.name,
          objectKind: folder.kind,
          object: object.name
        }
        const id = targetTabId(target)
        targets.set(id, target)
        return { id, label: object.name, nodeKind: folder.kind }
      })
      return {
        id: folderId(database.name, folder.nodeKey),
        label: t(folder.labelKey, { count: objects.length }),
        nodeKind: 'folder' as const,
        children
      }
    })

    return {
      id: databaseId,
      label: database.name,
      nodeKind: 'database' as const,
      children: groups
    }
  })

  const connectionTarget: WorkspaceTarget = {
    kind: 'connection',
    connectionId: CONNECTION.id
  }
  const connectionId = targetTabId(connectionTarget)
  targets.set(connectionId, connectionTarget)

  return {
    targets,
    nodes: [
      {
        id: connectionId,
        label: CONNECTION.name,
        nodeKind: 'connection',
        badge: t('shell.tree.activeBadge'),
        children: databases
      }
    ]
  }
})

const defaultExpanded: readonly string[] = [
  targetTabId({ kind: 'connection', connectionId: CONNECTION.id }),
  ...DATABASES.map((database) =>
    targetTabId({ kind: 'database', database: database.name })
  ),
  ...DATABASES.flatMap((database) =>
    folders.map((folder) => folderId(database.name, folder.nodeKey))
  )
]

function onActivate(id: string): void {
  const target = tree.value.targets.get(id)
  if (target !== undefined) {
    emit('activate', target)
  }
}
</script>

<template>
  <ObjectTree
    :nodes="tree.nodes"
    :label="t('shell.tree.label')"
    :default-expanded="defaultExpanded"
    @activate="onActivate"
  />
</template>
