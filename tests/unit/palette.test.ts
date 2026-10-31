import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  PALETTES,
  PALETTE_TOKENS,
  type Palette
} from '../../src/renderer/src/theme/palette'

const css = readFileSync(new URL('../../src/renderer/src/styles/tokens.css', import.meta.url), 'utf8')

function declarations(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  expect(start, `selector ${selector}`).toBeGreaterThanOrEqual(0)
  const end = css.indexOf('}', start)
  const body = css.slice(start + selector.length + 2, end)
  const values: Record<string, string> = {}

  for (const line of body.split('\n')) {
    const match = /^\s*(--[\w-]+)\s*:\s*([^;]+);/.exec(line)
    const name = match?.[1]
    const value = match?.[2]
    if (name !== undefined && value !== undefined) {
      values[name] = value.trim()
    }
  }

  return values
}

const light = declarations(':root')
const dark = declarations(":root[data-theme='dark']")
const keys = Object.keys(PALETTES.light) as Array<keyof Palette>

describe('palette and CSS tokens', () => {
  for (const theme of ['light', 'dark'] as const) {
    const tokens = theme === 'light' ? light : dark

    it(`${theme} palette mirrors tokens.css`, () => {
      for (const key of keys) {
        expect(tokens[PALETTE_TOKENS[key]], key).toBe(PALETTES[theme][key])
      }
    })
  }

  it('defines every palette token in both themes', () => {
    for (const key of keys) {
      expect(light[PALETTE_TOKENS[key]], `light ${key}`).toBeDefined()
      expect(dark[PALETTE_TOKENS[key]], `dark ${key}`).toBeDefined()
    }
  })
})
