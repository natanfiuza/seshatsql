/**
 * Pure geometry for AppSplit, kept separate so clamping and keyboard steps are
 * unit-testable without a DOM.
 *
 * Every function works on the start pane: "start" is the left pane for a
 * vertical split and the top pane for a horizontal one. The end pane always
 * takes whatever is left after the splitter.
 */
export const SPLITTER_SIZE = 4
export const KEYBOARD_STEP = 8

export interface SplitRange {
  /** Container extent in pixels, splitter included. */
  extent: number
  minStart: number
  minEnd: number
}

export function maxStart(range: SplitRange): number {
  return Math.max(range.minStart, range.extent - SPLITTER_SIZE - range.minEnd)
}

export function clampStart(start: number, range: SplitRange): number {
  const rounded = Number.isFinite(start) ? Math.round(start) : range.minStart
  return Math.min(Math.max(rounded, range.minStart), maxStart(range))
}

export function moveStart(start: number, delta: number, range: SplitRange): number {
  return clampStart(start + delta, range)
}

/**
 * Turns a separator key into a new start size. Returns null for keys the
 * separator does not own, so the browser keeps handling them.
 */
export function keyboardStart(start: number, key: string, range: SplitRange): number | null {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      return moveStart(start, -KEYBOARD_STEP, range)
    case 'ArrowRight':
    case 'ArrowDown':
      return moveStart(start, KEYBOARD_STEP, range)
    case 'Home':
      return range.minStart
    case 'End':
      return maxStart(range)
    default:
      return null
  }
}
