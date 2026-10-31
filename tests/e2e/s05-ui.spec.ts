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

test('loads the shell through the app:// scheme in a desktop-sized window', async () => {
  expect(await page.url()).toBe('app://seshat/index.html')
  await expect(page).toHaveTitle('SeshatSQL')

  const window = await app.evaluate(({ BrowserWindow, Menu }) => {
    const browserWindow = BrowserWindow.getAllWindows()[0]
    return {
      size: browserWindow?.getSize() ?? null,
      minimum: browserWindow?.getMinimumSize() ?? null,
      hasApplicationMenu: Menu.getApplicationMenu() !== null
    }
  })
  expect(window.size).toEqual([950, 600])
  expect(window.minimum).toEqual([865, 480])
  expect(window.hasApplicationMenu).toBe(false)

  const editor = page.locator('[data-testid="monaco-editor"]')
  expect(await editor.getAttribute('data-language')).toBe('mysql')
  expect(await editor.getAttribute('data-model-uri')).toBe('inmemory://seshat/tab/query-1')

  await expect(page.locator('[data-testid="result-grid"] .ag-row')).toHaveCount(4)
  await expect(page.locator('[data-testid="result-grid"] .ag-header-cell').first()).toBeVisible()
  await expect(page.locator('.menubar__button').first()).toHaveText('File')
  await expect(page.locator('.statusbar')).toContainText('Sample data · SeshatSQL')
  await expect(page.locator('.object-tree')).toContainText('seshat_lab (sample)')
})

test('keeps the observed desktop density and never scrolls the page', async () => {
  const heights = await page.evaluate(() => {
    const height = (selector: string): number => {
      const element = document.querySelector(selector)
      return element === null ? -1 : Math.round(element.getBoundingClientRect().height)
    }
    return {
      menubar: height('.menubar'),
      toolbar: height('.toolbar'),
      tabs: height('.tabstrip'),
      status: height('.statusbar'),
      gridHeader: height('.ag-header-row'),
      gridRow: height('.ag-row'),
      treeWidth: Math.round(document.querySelector('.object-tree')?.getBoundingClientRect().width ?? -1),
      splitterWidth: Math.round(
        document.querySelector('.app-split__divider--vertical')?.getBoundingClientRect().width ?? -1
      ),
      splitterHeight: Math.round(
        document.querySelector('.app-split__divider--horizontal')?.getBoundingClientRect().height ?? -1
      )
    }
  })

  expect(heights).toEqual({
    menubar: 22,
    toolbar: 26,
    tabs: 24,
    status: 20,
    gridHeader: 24,
    gridRow: 20,
    treeWidth: 270,
    splitterWidth: 4,
    splitterHeight: 4
  })

  const scroll = await page.evaluate(() => {
    const fits = (element: HTMLElement) =>
      element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight
    return { html: fits(document.documentElement), body: fits(document.body) }
  })
  expect(scroll).toEqual({ html: true, body: true })

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.setSize(865, 480)
  })
  await expect
    .poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getSize()))
    .toEqual([865, 480])

  const smallScroll = await page.evaluate(() => {
    const fits = (element: HTMLElement) =>
      element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight
    return { html: fits(document.documentElement), body: fits(document.body) }
  })
  expect(smallScroll).toEqual({ html: true, body: true })
  await expect(page.locator('.toolbar__select').last()).toBeVisible()

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.setSize(950, 600)
  })
  await expect
    .poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getSize()))
    .toEqual([950, 600])
})

test('resizes panels with the keyboard and respects the minimums', async () => {
  const log = page.locator('.sql-log')
  const initial = (await log.boundingBox())?.height ?? 0
  expect(Math.round(initial)).toBe(80)

  const separator = page.locator('[role="separator"]').nth(2)
  await separator.focus()
  await page.keyboard.press('ArrowUp')
  await expect.poll(async () => Math.round((await log.boundingBox())?.height ?? 0)).toBe(88)

  await page.keyboard.press('ArrowDown')
  await expect.poll(async () => Math.round((await log.boundingBox())?.height ?? 0)).toBe(80)

  await page.keyboard.press('End')
  await expect
    .poll(async () => Math.round((await log.boundingBox())?.height ?? 0))
    .toBe(40)

  await page.keyboard.press('Home')
  await expect
    .poll(async () => Math.round((await log.boundingBox())?.height ?? 0))
    .toBeGreaterThan(120)

  // Put the splitter back so the rest of the suite sees the default layout.
  await page.keyboard.press('End')
  for (let step = 0; step < 5; step += 1) {
    await page.keyboard.press('ArrowUp')
  }
  await expect.poll(async () => Math.round((await log.boundingBox())?.height ?? 0)).toBe(80)
})

test('opens an inert menu from the menu bar', async () => {
  await page.locator('.menubar__button').first().click()

  const items = page.locator('.menubar__item')
  await expect(items).toHaveCount(6)
  await expect(items.first()).toHaveAttribute('aria-disabled', 'true')
  await expect(items.first()).toHaveAttribute('title', 'Not available in this preview.')

  await page.keyboard.press('Escape')
  await expect(page.locator('.menubar__dropdown')).toHaveCount(0)
})

test('Monaco accepts input with its worker under the strict CSP', async () => {
  // Monaco 0.57 edits through the EditContext element; the decoration overlay
  // would intercept a click on the rendered lines, so focus the input directly.
  await page.locator('.monaco-editor .native-edit-context').focus()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' -- worker ok')

  await expect(page.locator('.monaco-editor .view-lines')).toContainText('-- worker ok')

  expect(consoleErrors.filter((message) => /worker|content security|csp/i.test(message))).toEqual([])
  expect(pageErrors).toEqual([])
})

test('Ctrl+C copies the selected row as TSV without the row number', async () => {
  await page.locator('[data-testid="result-grid"] .ag-row').first().click()
  await page.keyboard.press('Control+c')

  const clipboardText = await app.evaluate(({ clipboard }) => clipboard.readText())

  // The serializer emits LF; the Windows clipboard stores and returns CRLF.
  expect(clipboardText).toBe(
    ['id\tfull_name\tstatus\tnotes\tamount', '1\tAna Silva\tactive\t\t1250.5'].join('\r\n')
  )

  await expect(page.locator('[role="status"]')).toHaveText('Copied to the clipboard.')
  await expect(page.locator('[role="status"]')).toHaveText('Rows: 4', { timeout: 5_000 })
})

test('the theme switch recolors chrome, tree and grid', async () => {
  await page.selectOption('[data-testid="theme-select"]', 'dark')

  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('dark')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(32, 32, 32)'
  )
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'dark'
  )
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.object-tree')!).backgroundColor))
    .toBe('rgb(30, 30, 30)')

  // AG Grid paints the header surface through the ::after of .ag-header-row, so
  // the row itself computes as transparent; read the painted layer and the var.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const wrapper = document.querySelector('.ag-root-wrapper')
        const row = document.querySelector('.ag-header-row')
        return {
          surface: wrapper === null ? '' : getComputedStyle(wrapper).backgroundColor,
          headerVar:
            wrapper === null
              ? ''
              : getComputedStyle(wrapper).getPropertyValue('--ag-header-background-color').trim(),
          headerPaint: row === null ? '' : getComputedStyle(row, '::after').backgroundColor
        }
      })
    )
    .toEqual({
      surface: 'rgb(30, 30, 30)',
      headerVar: '#2d2d2d',
      headerPaint: 'rgb(45, 45, 45)'
    })

  await page.selectOption('[data-testid="theme-select"]', 'light')
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
    .toBe('light')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(240, 240, 240)'
  )
})

test('the language switch updates menu, tree, status and the grid live', async () => {
  await page.selectOption('[data-testid="locale-select"]', 'fr')

  await expect(page.locator('.menubar__button').first()).toHaveText('Fichier')
  await expect(page.locator('.object-tree')).toContainText('Tables (3)')
  await expect(page.locator('.statusbar')).toContainText('Déconnecté')
  await expect(page.locator('.statusbar')).toContainText('Lignes : 4')
  await expect(page.locator('[data-testid="locale-select"]')).toHaveAttribute(
    'title',
    /s'applique au prochain démarrage/
  )
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr')

  // AG Grid announces the localized header hint through a live region instead
  // of exposing it as an attribute on the header cell.
  // The first header is the pinned, non-sortable "#" column; the second sorts.
  await page.locator('[data-testid="result-grid"] .ag-header-cell').nth(1).click()
  await expect(page.locator('.ag-aria-description-container')).toContainText(
    'Appuyez sur Entrée pour trier'
  )

  await page.selectOption('[data-testid="locale-select"]', 'en-US')
  await expect(page.locator('.menubar__button').first()).toHaveText('File')
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
