// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ResultGrid from '../../src/renderer/src/grid/ResultGrid.vue'
import type { GridColumnDescriptor } from '../../src/renderer/src/grid/tsv'
import { i18n, setLocale } from '../../src/renderer/src/i18n'

interface CapturedProps {
  columnDefs: Array<{ field: string; headerName: string; valueFormatter: (params: { value: unknown }) => string }>
  rowData: Array<Record<string, unknown>>
  rowSelection: Record<string, unknown>
  localeText: Record<string, string>
  enableCellTextSelection: boolean
  defaultColDef: Record<string, unknown>
}

const gridState = vi.hoisted(() => ({
  selectedRows: [] as Record<string, unknown>[],
  focusedCell: null as { rowIndex: number; columnId: string } | null,
  displayedRows: [] as Record<string, unknown>[],
  setCalls: [] as Array<{ key: string; value: unknown }>,
  readyCount: 0,
  captured: [] as Array<Record<string, unknown>>
}))

vi.mock('ag-grid-community', () => ({
  AllCommunityModule: { moduleName: 'AllCommunity' },
  ModuleRegistry: { registerModules: vi.fn() },
  themeQuartz: {
    withParams: (params: Record<string, unknown>) => ({ params })
  }
}))

vi.mock('ag-grid-vue3', async () => {
  const { defineComponent, h, onMounted } = await import('vue')

  return {
    AgGridVue: defineComponent({
      name: 'AgGridVueStub',
      props: {
        theme: { type: Object, required: true },
        columnDefs: { type: Array, required: true },
        rowData: { type: Array, required: true },
        defaultColDef: { type: Object, required: true },
        rowSelection: { type: Object, required: true },
        localeText: { type: Object, required: true },
        enableCellTextSelection: { type: Boolean, required: true }
      },
      emits: ['gridReady'],
      setup(props, { emit }) {
        gridState.captured.push(props as unknown as Record<string, unknown>)

        onMounted(() => {
          gridState.readyCount += 1
          emit('gridReady', {
            api: {
              getSelectedRows: () => gridState.selectedRows,
              getFocusedCell: () => {
                const focused = gridState.focusedCell
                return focused === null
                  ? null
                  : {
                      rowIndex: focused.rowIndex,
                      column: { getColId: () => focused.columnId }
                    }
              },
              getDisplayedRowAtIndex: (index: number) => ({ data: gridState.displayedRows[index] }),
              setGridOption: (key: string, value: unknown) => {
                gridState.setCalls.push({ key, value })
              }
            }
          })
        })

        return () => h('div', { 'data-testid': 'ag-grid-stub' })
      }
    })
  }
})

const columns: readonly GridColumnDescriptor[] = [
  { field: 'id', header: 'id' },
  { field: 'name', header: 'name' }
]

const rows: readonly Record<string, unknown>[] = [
  { id: 1, name: 'Ana' },
  { id: 2, name: null }
]

const clipboard = { writeText: vi.fn(async () => undefined) }

function mountGrid() {
  return mount(ResultGrid, {
    props: { columns, rows, theme: 'light', locale: 'en-US' },
    global: { plugins: [i18n] }
  })
}

function captured(index: number): CapturedProps {
  return gridState.captured[index] as unknown as CapturedProps
}

beforeEach(() => {
  clipboard.writeText.mockClear()
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
  gridState.selectedRows = []
  gridState.focusedCell = null
  gridState.displayedRows = []
  gridState.setCalls = []
  gridState.readyCount = 0
  gridState.captured = []
  setLocale('en-US')
})

describe('ResultGrid', () => {
  it('configures Community sorting, text selection and translated chrome', async () => {
    const wrapper = mountGrid()
    await flushPromises()

    const props = captured(0)
    expect(props.columnDefs.map((column) => column.field)).toEqual(['id', 'name'])
    expect(props.columnDefs[0]?.valueFormatter({ value: null })).toBe('NULL')
    expect(props.rowData).toEqual(rows)
    expect(props.rowSelection).toMatchObject({
      mode: 'multiRow',
      checkboxes: false,
      headerCheckbox: false,
      enableClickSelection: true
    })
    expect(props.enableCellTextSelection).toBe(true)
    expect(props.localeText['noRowsToShow']).toBe('No rows to show')
    expect(wrapper.find('[data-testid="result-grid"]').exists()).toBe(true)
  })

  it('copies selected rows as TSV with headers on Ctrl+C', async () => {
    const wrapper = mountGrid()
    await flushPromises()
    gridState.selectedRows = [{ id: 1, name: 'Ana' }]

    await wrapper.get('[data-testid="result-grid"]').trigger('keydown', { key: 'c', ctrlKey: true })
    await flushPromises()

    expect(clipboard.writeText).toHaveBeenCalledWith('id\tname\n1\tAna')
    expect(wrapper.emitted('copy')?.[0]).toEqual([{ copied: true, mode: 'rows' }])
  })

  it('copies the focused cell when no row is selected', async () => {
    const wrapper = mountGrid()
    await flushPromises()
    gridState.focusedCell = { rowIndex: 0, columnId: 'name' }
    gridState.displayedRows = [...rows]

    await wrapper.get('[data-testid="result-grid"]').trigger('keydown', { key: 'c', ctrlKey: true })
    await flushPromises()

    expect(clipboard.writeText).toHaveBeenCalledWith('Ana')
    expect(wrapper.emitted('copy')?.[0]).toEqual([{ copied: true, mode: 'cell' }])
  })

  it('does nothing on Ctrl+C without a selection or focused cell', async () => {
    const wrapper = mountGrid()
    await flushPromises()

    await wrapper.get('[data-testid="result-grid"]').trigger('keydown', { key: 'c', ctrlKey: true })
    await flushPromises()

    expect(clipboard.writeText).not.toHaveBeenCalled()
    expect(wrapper.emitted('copy')).toBeUndefined()
  })

  it('updates the grid theme through the Community theming API', async () => {
    const wrapper = mountGrid()
    await flushPromises()

    await wrapper.setProps({ theme: 'dark' })

    expect(gridState.setCalls).toHaveLength(1)
    expect(gridState.setCalls[0]?.key).toBe('theme')
    expect(gridState.setCalls[0]?.value).toMatchObject({
      params: { backgroundColor: '#1e2128', browserColorScheme: 'dark' }
    })
  })

  it('recreates the grid so grid chrome follows a live locale change', async () => {
    const wrapper = mountGrid()
    await flushPromises()

    // The workspace switches the catalogue before handing the new locale down.
    setLocale('pt-BR')
    await wrapper.setProps({ locale: 'pt-BR' })
    await flushPromises()

    expect(gridState.readyCount).toBe(2)
    expect(captured(1).localeText['noRowsToShow']).toBe('Nenhuma linha para exibir')
  })
})
