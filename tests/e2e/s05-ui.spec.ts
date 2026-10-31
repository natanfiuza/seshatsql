import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type ElectronApplication, type Page } from '@playwright/test'

import { launchApp } from './launch'

let app: ElectronApplication
let page: Page
let requestLogPath: string
const consoleErrors: string[] = []
const pageErrors: string[] = []

test.beforeAll(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'seshat-s05-'))
  requestLogPath = join(directory, 'requests.log')

  app = await launchApp({ requestLog: requestLogPath })
  page = await app.firstWindow()

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor')
  // The operating-system locale decides the first launch; pin it for assertions.
  await page.selectOption('[data-testid="locale-select"]', 'en-US')
})

test.afterAll(async () => {
  await app.close()
})

test('loads the built renderer through the app:// scheme', async () => {
  expect(await page.url()).toBe('app://seshat/index.html')
  await expect(page.locator('h1')).toHaveText('SeshatSQL')

  const editor = page.locator('[data-testid="monaco-editor"]')
  expect(await editor.getAttribute('data-language')).toBe('mysql')
  expect(await editor.getAttribute('data-model-uri')).toBe('inmemory://seshat/tab/s05-lab')

  await expect(page.locator('[data-testid="result-grid"] .ag-row')).toHaveCount(4)
  await expect(page.locator('[data-testid="result-grid"] .ag-header-cell').first()).toBeVisible()
})

test('Monaco accepts input with its worker under the strict CSP', async () => {
  await page.locator('.monaco-editor .view-lines').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' -- worker ok')

  await expect(page.locator('.monaco-editor .view-lines')).toContainText('-- worker ok')

  expect(consoleErrors.filter((message) => /worker|content security|csp/i.test(message))).toEqual([])
  expect(pageErrors).toEqual([])
})

test('Ctrl+C copies the selected row as TSV with headers', async () => {
  await page.locator('[data-testid="result-grid"] .ag-row').first().click()
  await page.keyboard.press('Control+c')

  const clipboardText = await app.evaluate(({ clipboard }) => clipboard.readText())

  // The serializer emits LF; the Windows clipboard stores and returns CRLF.
  expect(clipboardText).toBe(
    ['id\tfull_name\tstatus\tnotes\tamount', '1\tAna Silva\tactive\t\t1250.5'].join('\r\n')
  )
})

test('the theme switch updates the document and the grid', async () => {
  await page.selectOption('[data-testid="theme-select"]', 'dark')

  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('dark')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(22, 24, 29)'
  )

  await page.selectOption('[data-testid="theme-select"]', 'light')
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('light')
})

test('the language switch updates the interface and the grid live', async () => {
  await page.selectOption('[data-testid="locale-select"]', 'fr')

  await expect(page.locator('.lab__intro')).toContainText("Laboratoire d'interface")
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr')

  // AG Grid announces the localized header hint through a live region instead
  // of exposing it as an attribute on the header cell.
  await page.locator('[data-testid="result-grid"] .ag-header-cell').first().click()
  await expect(page.locator('.ag-aria-description-container')).toContainText(
    'Appuyez sur Entrée pour trier'
  )

  await page.selectOption('[data-testid="locale-select"]', 'en-US')
  await expect(page.locator('.lab__intro')).toContainText('Interface lab')
})

test('only app:// requests are made', async () => {
  await expect
    .poll(
      async () => {
        const content = await readFile(requestLogPath, 'utf8')
        return content.trim().split('\n').filter(Boolean).length
      },
      { timeout: 10_000 }
    )
    .toBeGreaterThan(0)

  const lines = (await readFile(requestLogPath, 'utf8')).trim().split('\n').filter(Boolean)
  for (const line of lines) {
    const url = line.split(' ')[2] ?? ''
    expect(url, `unexpected request: ${line}`).toMatch(/^app:\/\/seshat\//)
  }

  // AG Grid reports unregistered feature modules as console errors; this also
  // covers the whole suite because it runs last.
  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})
