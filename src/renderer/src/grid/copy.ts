import { serializeCell, serializeRowsWithHeaders, type GridColumnDescriptor } from './tsv'

/** Minimal grid surface needed by the copy action; keeps it testable without AG Grid. */
export interface CopyGridApi {
  getSelectedRows: () => ReadonlyArray<Record<string, unknown>>
  getFocusedCell: () => { rowIndex: number; column: { getColId: () => string } } | null
  getDisplayedRowAtIndex: (index: number) => { data?: Record<string, unknown> } | undefined
}

export interface CopyClipboard {
  writeText: (text: string) => Promise<void>
}

export type CopyOutcome =
  | { copied: true; mode: 'rows' | 'cell' }
  | { copied: false; reason: 'text-selection' | 'empty' | 'clipboard-error' }

export interface CopyRequest {
  api: CopyGridApi
  columns: readonly GridColumnDescriptor[]
  /** True when the user selected text with the mouse; the browser copy wins. */
  hasTextSelection: boolean
  clipboard: CopyClipboard
}

/**
 * Selected rows are copied as TSV with headers. Without a row selection the
 * focused cell value is copied. An active mouse text selection is left to the
 * browser so free-form copying keeps working.
 */
export async function copyGridSelection(request: CopyRequest): Promise<CopyOutcome> {
  if (request.hasTextSelection) {
    return { copied: false, reason: 'text-selection' }
  }

  const selected = request.api.getSelectedRows()
  let text: string | null = null
  let mode: 'rows' | 'cell' = 'rows'

  if (selected.length > 0) {
    text = serializeRowsWithHeaders(request.columns, selected)
  } else {
    const focused = request.api.getFocusedCell()
    if (focused !== null) {
      const displayed = request.api.getDisplayedRowAtIndex(focused.rowIndex)
      const columnId = focused.column.getColId()
      const descriptor = request.columns.find((column) => column.field === columnId)
      if (displayed?.data !== undefined && descriptor !== undefined) {
        text = serializeCell(displayed.data[descriptor.field])
        mode = 'cell'
      }
    }
  }

  if (text === null) {
    return { copied: false, reason: 'empty' }
  }

  try {
    await request.clipboard.writeText(text)
  } catch {
    return { copied: false, reason: 'clipboard-error' }
  }

  return { copied: true, mode }
}
