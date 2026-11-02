<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ResultGrid from '../../grid/ResultGrid.vue'
import type { GridColumnDescriptor } from '../../grid/tsv'
import type { SupportedLocale } from '../../i18n'
import type { ResolvedTheme } from '../../theme/theme'
import type { MockGrid } from './catalog'
import { formatValue } from './format'

const props = withDefaults(
  defineProps<{
    grid: MockGrid
    theme: ResolvedTheme
    locale: SupportedLocale
    testId: string
    showRowNumbers?: boolean
  }>(),
  { showRowNumbers: false }
)

const emit = defineEmits<{
  rowClick: [row: Record<string, unknown>]
  rowDoubleClick: [row: Record<string, unknown>]
}>()

const { t } = useI18n()

function translate(key: string): string {
  return t(key)
}

const columns = computed<GridColumnDescriptor[]>(() =>
  props.grid.columns.map((column) => ({
    field: column.field,
    header:
      column.headerKey !== undefined
        ? t(column.headerKey)
        : (column.header ?? column.field),
    align: column.align
  }))
)

const rows = computed<Record<string, unknown>[]>(() =>
  props.grid.rows.map((row) => {
    const formatted: Record<string, unknown> = { ...row }
    for (const column of props.grid.columns) {
      formatted[column.field] = formatValue(
        row[column.field],
        column.format,
        props.locale,
        translate
      )
    }
    return formatted
  })
)
</script>

<template>
  <ResultGrid
    :columns="columns"
    :rows="rows"
    :theme="theme"
    :locale="locale"
    :show-row-numbers="showRowNumbers"
    :test-id="testId"
    @row-click="emit('rowClick', $event)"
    @row-double-click="emit('rowDoubleClick', $event)"
  />
</template>
