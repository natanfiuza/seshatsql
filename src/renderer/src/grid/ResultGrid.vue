<script setup lang="ts">
// Side-effect import: registers the Community modules before any grid exists.
import './grid-setup'
import { AgGridVue } from 'ag-grid-vue3'
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowSelectionOptions,
  ValueFormatterParams
} from 'ag-grid-community'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { SupportedLocale } from '../i18n'
import type { ResolvedTheme } from '../theme/theme'
import { copyGridSelection, type CopyOutcome } from './copy'
import { createGridLocaleText } from './grid-locale'
import { createGridTheme } from './grid-theme'
import { formatCellForDisplay, type GridColumnDescriptor } from './tsv'

const props = defineProps<{
  columns: readonly GridColumnDescriptor[]
  rows: readonly Record<string, unknown>[]
  theme: ResolvedTheme
  locale: SupportedLocale
}>()

const emit = defineEmits<{ copy: [outcome: CopyOutcome] }>()

const host = ref<HTMLDivElement | null>(null)
let gridApi: GridApi | null = null

const gridTheme = ref(createGridTheme(props.theme))

const columnDefs = computed<ColDef[]>(() =>
  props.columns.map((column) => ({
    field: column.field,
    headerName: column.header,
    sortable: true,
    resizable: true,
    minWidth: 120,
    flex: 1,
    valueFormatter: (params: ValueFormatterParams) => formatCellForDisplay(params.value)
  }))
)

const defaultColDef = computed<ColDef>(() => ({
  suppressHeaderMenuButton: true,
  suppressHeaderFilterButton: true
}))

const rowSelection = computed<RowSelectionOptions>(() => ({
  mode: 'multiRow',
  checkboxes: false,
  headerCheckbox: false,
  enableClickSelection: true
}))

/**
 * AG Grid treats localeText as an initial-only option, so the wrapper remounts
 * the grid when the locale changes instead of calling setGridOption. This keeps
 * every piece of grid chrome translated, at the cost of losing sort/selection.
 */
const localeText = computed(() => {
  void props.locale
  return createGridLocaleText()
})

const rowData = computed<Record<string, unknown>[]>(() => [...props.rows])

function onGridReady(event: GridReadyEvent): void {
  gridApi = event.api
}

watch(
  () => props.theme,
  (theme) => {
    gridTheme.value = createGridTheme(theme)
    gridApi?.setGridOption('theme', gridTheme.value)
  }
)

// The grid is recreated through its key, so the old API must not be reused.
watch(
  () => props.locale,
  () => {
    gridApi = null
  }
)

function hasGridTextSelection(): boolean {
  const selection = window.getSelection()
  if (selection === null || selection.toString().length === 0) {
    return false
  }
  return host.value !== null && host.value.contains(selection.anchorNode)
}

function onKeyDown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') {
    return
  }
  if (hasGridTextSelection() || gridApi === null) {
    return
  }
  if (gridApi.getSelectedRows().length === 0 && gridApi.getFocusedCell() === null) {
    return
  }

  event.preventDefault()
  void copyGridSelection({
    api: gridApi,
    columns: props.columns,
    hasTextSelection: false,
    clipboard: {
      writeText: (text) => {
        if (navigator.clipboard === undefined) {
          return Promise.reject(new Error('Clipboard is unavailable'))
        }
        return navigator.clipboard.writeText(text)
      }
    }
  }).then((outcome) => emit('copy', outcome))
}

onBeforeUnmount(() => {
  gridApi = null
})
</script>

<template>
  <div
    ref="host"
    class="result-grid"
    data-testid="result-grid"
    @keydown="onKeyDown"
  >
    <AgGridVue
      :key="locale"
      class="result-grid__grid"
      :theme="gridTheme"
      :column-defs="columnDefs"
      :row-data="rowData"
      :default-col-def="defaultColDef"
      :row-selection="rowSelection"
      :locale-text="localeText"
      :enable-cell-text-selection="true"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<style scoped>
.result-grid {
  height: 100%;
  min-height: 12rem;
}

.result-grid__grid {
  width: 100%;
  height: 100%;
}
</style>
