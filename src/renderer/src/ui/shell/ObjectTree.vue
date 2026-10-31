<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from './AppIcon.vue'
import {
  collectIds,
  filterTree,
  flattenTree,
  parentIdOf,
  type TreeRow,
  type TreeSourceNode
} from './tree'

const props = defineProps<{
  nodes: readonly TreeSourceNode[]
  label: string
  defaultExpanded?: readonly string[]
}>()

const { t } = useI18n()

const root = ref<HTMLElement | null>(null)
const query = ref('')
const selectedId = ref<string | null>(null)
const activeId = ref<string | null>(null)
const expanded = ref<ReadonlySet<string>>(new Set(props.defaultExpanded ?? collectIds(props.nodes)))

const filtering = computed(() => query.value.trim() !== '')
const filtered = computed(() => filterTree(props.nodes, query.value))
const rows = computed(() => flattenTree(filtered.value, expanded.value, filtering.value))

const rovingId = computed<string | null>(() => {
  const active = activeId.value
  if (active !== null && rows.value.some((row) => row.id === active)) {
    return active
  }
  return rows.value[0]?.id ?? null
})

function setExpanded(id: string, value: boolean): void {
  const next = new Set(expanded.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  expanded.value = next
}

function toggle(row: TreeRow): void {
  setExpanded(row.id, !row.expanded)
}

function select(row: TreeRow): void {
  activeId.value = row.id
  selectedId.value = row.id
}

function onFilterInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value
}

function clearFilter(): void {
  query.value = ''
}

async function focusRow(id: string | null): Promise<void> {
  if (id === null) {
    return
  }
  activeId.value = id
  await nextTick()
  const row = root.value?.querySelector<HTMLElement>(`[data-node-id="${id}"]`)
  row?.focus()
}

function onRowKeydown(event: KeyboardEvent, row: TreeRow, index: number): void {
  const list = rows.value

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault()
      const next = list[index + 1]
      void focusRow(next?.id ?? row.id)
      break
    }
    case 'ArrowUp': {
      event.preventDefault()
      const previous = list[index - 1]
      void focusRow(previous?.id ?? row.id)
      break
    }
    case 'ArrowRight': {
      event.preventDefault()
      if (!row.hasChildren) {
        break
      }
      if (!row.expanded) {
        setExpanded(row.id, true)
        break
      }
      const child = list[index + 1]
      if (child !== undefined && child.depth > row.depth) {
        void focusRow(child.id)
      }
      break
    }
    case 'ArrowLeft': {
      event.preventDefault()
      if (row.expanded) {
        setExpanded(row.id, false)
        break
      }
      void focusRow(parentIdOf(list, index))
      break
    }
    case 'Home': {
      event.preventDefault()
      void focusRow(list[0]?.id ?? null)
      break
    }
    case 'End': {
      event.preventDefault()
      void focusRow(list[list.length - 1]?.id ?? null)
      break
    }
    case 'Enter':
    case ' ':
      event.preventDefault()
      select(row)
      break
    default:
      break
  }
}
</script>

<template>
  <section
    ref="root"
    class="object-tree"
    :aria-label="label"
  >
    <div class="object-tree__header">
      <label class="object-tree__filter-wrap">
        <AppIcon
          name="search"
          :size="12"
          class="object-tree__search"
        />
        <input
          type="search"
          class="object-tree__filter"
          :value="query"
          :placeholder="t('shell.tree.filterLabel')"
          :aria-label="t('shell.tree.filterLabel')"
          @input="onFilterInput"
          @keydown.esc="clearFilter"
        >
      </label>
    </div>

    <div
      class="object-tree__body"
      role="tree"
      :aria-label="label"
    >
      <div
        v-for="(row, index) in rows"
        :key="row.id"
        class="object-tree__row"
        :class="{
          'object-tree__row--selected': row.id === selectedId,
          'object-tree__row--folder': row.hasChildren
        }"
        role="treeitem"
        :data-node-id="row.id"
        :aria-level="row.depth + 1"
        :aria-expanded="row.hasChildren ? row.expanded : undefined"
        :aria-selected="row.id === selectedId"
        :tabindex="row.id === rovingId ? 0 : -1"
        :style="{ paddingLeft: `${8 + row.depth * 12}px` }"
        @click="select(row)"
        @focus="activeId = row.id"
        @keydown="onRowKeydown($event, row, index)"
      >
        <span
          class="object-tree__box"
          :class="{ 'object-tree__box--leaf': !row.hasChildren }"
          aria-hidden="true"
          @click.stop="row.hasChildren && toggle(row)"
        >{{ row.hasChildren ? (row.expanded ? '−' : '+') : '' }}</span>
        <AppIcon
          :name="row.hasChildren ? 'database' : 'grid'"
          :size="14"
          class="object-tree__icon"
        />
        <span class="object-tree__label">{{ row.label }}</span>
      </div>

      <p
        v-if="rows.length === 0"
        class="object-tree__empty"
      >
        {{ filtering ? t('shell.tree.noMatches') : t('shell.tree.empty') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.object-tree {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}

.object-tree__header {
  display: flex;
  flex: none;
  align-items: center;
  height: 26px;
  padding: 0 4px;
  background: var(--chrome-bg);
  border-bottom: 1px solid var(--border-soft);
}

.object-tree__filter-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.object-tree__search {
  position: absolute;
  left: 5px;
  color: var(--text-muted);
  pointer-events: none;
}

.object-tree__filter {
  width: 100%;
  height: 18px;
  padding: 0 4px 0 22px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--surface);
  color: var(--text);
  font-size: 11px;
}

.object-tree__filter:focus-visible {
  outline: 1px solid var(--focus);
  outline-offset: -1px;
}

.object-tree__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 2px 0;
}

.object-tree__row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--row-h);
  padding-right: 4px;
  color: var(--text);
  font-size: var(--font-size-ui);
  white-space: nowrap;
  cursor: default;
  user-select: none;
}

.object-tree__row:hover {
  background: var(--hover);
}

.object-tree__row:focus-visible {
  outline: 1px dotted var(--focus);
  outline-offset: -1px;
}

.object-tree__row--selected,
.object-tree__row--selected:hover {
  background: var(--selected-bg);
  color: var(--selected-text);
}

.object-tree__box {
  display: grid;
  place-items: center;
  flex: none;
  width: 11px;
  height: 11px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 10px;
  line-height: 1;
}

.object-tree__box--leaf {
  border-color: transparent;
  background: transparent;
}

.object-tree__row--selected .object-tree__box {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
}

.object-tree__icon {
  color: inherit;
}

.object-tree__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.object-tree__empty {
  margin: 6px 8px;
  color: var(--text-muted);
  font-size: 11px;
}
</style>
