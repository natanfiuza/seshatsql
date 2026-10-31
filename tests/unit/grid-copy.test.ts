import { describe, expect, it, vi } from 'vitest'

import {
  copyGridSelection,
  type CopyClipboard,
  type CopyGridApi
} from '../../src/renderer/src/grid/copy'
import type { GridColumnDescriptor } from '../../src/renderer/src/grid/tsv'

const columns: readonly GridColumnDescriptor[] = [
  { field: 'id', header: 'id' },
  { field: 'name', header: 'name' }
]

interface FakeApiOptions {
  selected?: ReadonlyArray<Record<string, unknown>>
  focused?: { rowIndex: number; columnId: string } | null
  rows?: ReadonlyArray<Record<string, unknown>>
}

function fakeApi(options: FakeApiOptions = {}): CopyGridApi {
  const rows = options.rows ?? []
  return {
    getSelectedRows: () => options.selected ?? [],
    getFocusedCell: () => {
      if (options.focused === null || options.focused === undefined) {
        return null
      }
      const columnId = options.focused.columnId
      return {
        rowIndex: options.focused.rowIndex,
        column: { getColId: () => columnId }
      }
    },
    getDisplayedRowAtIndex: (index) => {
      const data = rows[index]
      return data === undefined ? undefined : { data }
    }
  }
}

function fakeClipboard(writeText = vi.fn(async () => undefined)): CopyClipboard & {
  writeText: ReturnType<typeof vi.fn>
} {
  return { writeText }
}

describe('copyGridSelection', () => {
  it('leaves an active mouse selection to the browser', async () => {
    const clipboard = fakeClipboard()

    const outcome = await copyGridSelection({
      api: fakeApi({ selected: [{ id: 1, name: 'Ana' }] }),
      columns,
      hasTextSelection: true,
      clipboard
    })

    expect(outcome).toEqual({ copied: false, reason: 'text-selection' })
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  it('copies selected rows as TSV with headers', async () => {
    const clipboard = fakeClipboard()

    const outcome = await copyGridSelection({
      api: fakeApi({
        selected: [
          { id: 1, name: 'Ana' },
          { id: 2, name: null }
        ]
      }),
      columns,
      hasTextSelection: false,
      clipboard
    })

    expect(outcome).toEqual({ copied: true, mode: 'rows' })
    expect(clipboard.writeText).toHaveBeenCalledWith('id\tname\n1\tAna\n2\t')
  })

  it('copies only the focused cell when nothing is selected', async () => {
    const clipboard = fakeClipboard()

    const outcome = await copyGridSelection({
      api: fakeApi({
        focused: { rowIndex: 1, columnId: 'name' },
        rows: [{ id: 1, name: 'Ana' }, { id: 2, name: 'Zoë' }]
      }),
      columns,
      hasTextSelection: false,
      clipboard
    })

    expect(outcome).toEqual({ copied: true, mode: 'cell' })
    expect(clipboard.writeText).toHaveBeenCalledWith('Zoë')
  })

  it('reports empty when there is neither selection nor focused cell', async () => {
    const clipboard = fakeClipboard()

    const outcome = await copyGridSelection({
      api: fakeApi(),
      columns,
      hasTextSelection: false,
      clipboard
    })

    expect(outcome).toEqual({ copied: false, reason: 'empty' })
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  it('reports a clipboard failure instead of throwing', async () => {
    const clipboard: CopyClipboard = {
      writeText: vi.fn(() => Promise.reject(new Error('denied')))
    }

    const outcome = await copyGridSelection({
      api: fakeApi({ selected: [{ id: 1, name: 'Ana' }] }),
      columns,
      hasTextSelection: false,
      clipboard
    })

    expect(outcome).toEqual({ copied: false, reason: 'clipboard-error' })
  })
})
