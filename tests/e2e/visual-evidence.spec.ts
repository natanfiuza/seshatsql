import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { expect, test, type ElectronApplication, type Page } from '@playwright/test'

import { launchApp } from './launch'

/** Screenshots kept as evidence for the visual review; see docs/spikes. */
const OUTPUT = join(process.cwd(), 'docs', 'spikes', 'evidence', '20261031_s05-visual')

let app: ElectronApplication
let page: Page

async function setWindowSize(width: number, height: number): Promise<void> {
  await app.evaluate(
    ({ BrowserWindow }, size) => {
      BrowserWindow.getAllWindows()[0]?.setSize(size.width, size.height)
    },
    { width, height }
  )
  await expect
    .poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getSize()))
    .toEqual([width, height])
  await page.evaluate(() =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  )
}

async function capture(name: string): Promise<void> {
  // Park the pointer on an inert corner so a hovered splitter cannot tint the
  // evidence with the accent color.
  await page.mouse.move(0, 0)
  await page.screenshot({ path: join(OUTPUT, `${name}.png`) })
}

test.beforeAll(async () => {
  await mkdir(OUTPUT, { recursive: true })
  app = await launchApp()
  page = await app.firstWindow()
  await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor')
  await page.selectOption('[data-testid="locale-select"]', 'en-US')
  await page.waitForSelector('[data-testid="result-grid"] .ag-row')
})

test.afterAll(async () => {
  await app.close()
})

test('captures the shell at the reference sizes and themes', async () => {
  await capture('en-US_light_950x600')

  await page.selectOption('[data-testid="theme-select"]', 'dark')
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('dark')
  await capture('en-US_dark_950x600')

  await setWindowSize(865, 480)
  await capture('en-US_dark_865x480')

  await page.selectOption('[data-testid="theme-select"]', 'light')
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('light')
  await capture('en-US_light_865x480')

  await setWindowSize(950, 600)
  await page.selectOption('[data-testid="locale-select"]', 'fr')
  await expect(page.locator('.menubar__button').first()).toHaveText('Fichier')
  await capture('fr_light_950x600')
})
