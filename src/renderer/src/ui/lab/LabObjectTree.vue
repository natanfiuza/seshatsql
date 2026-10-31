<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ObjectTree from '../shell/ObjectTree.vue'
import type { TreeSourceNode } from '../shell/tree'
import { SAMPLE_TABLES, SAMPLE_VIEWS } from './sample-data'

const { t } = useI18n()

const DEFAULT_EXPANDED: readonly string[] = ['root', 'tables']

const nodes = computed<TreeSourceNode[]>(() => [
  {
    id: 'root',
    label: t('shell.tree.sampleRoot'),
    children: [
      {
        id: 'tables',
        label: t('shell.tree.tables', { count: SAMPLE_TABLES.length }),
        children: SAMPLE_TABLES.map((name) => ({ id: `table:${name}`, label: name }))
      },
      {
        id: 'views',
        label: t('shell.tree.views', { count: SAMPLE_VIEWS.length }),
        children: SAMPLE_VIEWS.map((name) => ({ id: `view:${name}`, label: name }))
      }
    ]
  }
])
</script>

<template>
  <ObjectTree
    :nodes="nodes"
    :label="t('shell.tree.label')"
    :default-expanded="DEFAULT_EXPANDED"
  />
</template>
