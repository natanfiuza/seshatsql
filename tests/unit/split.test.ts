import { describe, expect, it } from 'vitest'

import {
  KEYBOARD_STEP,
  SPLITTER_SIZE,
  clampStart,
  keyboardStart,
  maxStart,
  moveStart,
  type SplitRange
} from '../../src/renderer/src/ui/shell/split'

const range: SplitRange = { extent: 800, minStart: 100, minEnd: 200 }

describe('split geometry', () => {
  it('reserves the splitter and the end minimum when computing the maximum', () => {
    expect(SPLITTER_SIZE).toBe(4)
    expect(maxStart(range)).toBe(800 - SPLITTER_SIZE - 200)
  })

  it('never lets the maximum fall below the start minimum', () => {
    expect(maxStart({ extent: 250, minStart: 100, minEnd: 200 })).toBe(100)
  })

  it('clamps a size into the allowed range', () => {
    expect(clampStart(50, range)).toBe(100)
    expect(clampStart(700, range)).toBe(596)
    expect(clampStart(320.6, range)).toBe(321)
  })

  it('falls back to the start minimum for non-finite input', () => {
    expect(clampStart(Number.NaN, range)).toBe(100)
    expect(clampStart(Number.POSITIVE_INFINITY, range)).toBe(100)
  })

  it('moves by a delta without crossing the limits', () => {
    expect(moveStart(300, 20, range)).toBe(320)
    expect(moveStart(110, -40, range)).toBe(100)
    expect(moveStart(590, 40, range)).toBe(596)
  })

  it('maps separator keys to bounded steps', () => {
    expect(keyboardStart(300, 'ArrowRight', range)).toBe(300 + KEYBOARD_STEP)
    expect(keyboardStart(300, 'ArrowDown', range)).toBe(300 + KEYBOARD_STEP)
    expect(keyboardStart(300, 'ArrowLeft', range)).toBe(300 - KEYBOARD_STEP)
    expect(keyboardStart(300, 'ArrowUp', range)).toBe(300 - KEYBOARD_STEP)
    expect(keyboardStart(300, 'Home', range)).toBe(100)
    expect(keyboardStart(300, 'End', range)).toBe(596)
    expect(keyboardStart(300, 'PageDown', range)).toBeNull()
  })
})
