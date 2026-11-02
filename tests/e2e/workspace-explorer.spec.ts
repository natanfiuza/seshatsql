import { mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type ElectronApplication, type Locator, type Page } from '@playwright/test'

import { launchApp } from './launch'

const EVIDENCE = join(
  process.cwd(),
  'docs',
  'spikes',
  'evidence',
  '20261101_workspace-explorer'
)

let app: ElectronApplication
let page: Page
let dataDir: string

function workspaceTabs(): Locator {
  return page.locator('.workspace > .tabstrip [role="tab"]')
}

function queryTabs(): Locator {
  return workspaceTabs().filter({ hasText: /^Query \d+$/ })
}

function structureTabs(): Locator {
  return page.locator('.object-view > .tabstrip [role="tab"]')
}

async function openTreeRow(nodeId: string): Promise<void> {
  await page.locator(`[data-node-id="${nodeId}"]`).click()
}

async function activateWorkspaceTab(label: string): Promise<void> {
  await workspaceTabs().filter({ hasText: label }).first().click()
}

async function capture(name: string): Promise<void> {
  await page.mouse.move(0, 0)
  await page.screenshot({ path: join(EVIDENCE, `${name}.png`) })
}

test.beforeAll(async () => {
  await mkdir(EVIDENCE, { recursive: true })
  dataDir = await mkdtemp(join(tmpdir(), 'seshat-workspace-'))
  app = await launchApp({ dataDir })
  page = await app.firstWindow()
  await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor')
  await page.selectOption('[data-testid="locale-select"]', 'en-US')
  await page.waitForSelector('[data-testid="result-grid"] .ag-row')
})

test.afterAll(async () => {
  await app.close()
})

test('shows the active connection, databases and object groups', async () => {
  const tree = page.locator('.object-tree')
  await expect(tree).toContainText('Seshat Lab')
  await expect(tree).toContainText('Active')
  await expect(tree).toContainText('seshat_lab')
  await expect(tree).toContainText('analytics')
  await expect(tree).toContainText('archive')
  await expect(tree).toContainText('Tables (3)')

  await page.locator('.object-tree__filter').fill('custom')
  await expect(tree).toContainText('customers')
  await expect(tree).not.toContainText('orders')
  await page.locator('.object-tree__filter').fill('')
  await expect(tree).toContainText('orders')
})

test('opens the connection sub-tabs with counted grids', async () => {
  await openTreeRow('connection:seshat-lab')

  await expect(workspaceTabs().filter({ hasText: 'Seshat Lab' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  const tabs = page.locator('.connection-view [role="tab"]')
  await expect(tabs).toHaveCount(5)
  await expect(tabs).toHaveText([
    'Databases (3)',
    'Variables (7)',
    'Status (6)',
    'Processes (4)',
    'Command statistics (6)'
  ])

  const headers = (): Promise<string[]> =>
    page.locator('[data-testid="connection-grid-databases"] .ag-header-cell-text').allTextContents()
  expect(await headers()).toEqual(['Name', 'Tables', 'Views', 'Size', 'Collation'])
  await capture('connection_databases')

  await tabs.filter({ hasText: 'Variables' }).click()
  await expect(
    page.locator('[data-testid="connection-grid-variables"] .ag-header-cell-text')
  ).toHaveText(['Variable', 'Value', 'Scope'])

  await tabs.filter({ hasText: 'Processes' }).click()
  await expect(
    page.locator('[data-testid="connection-grid-processes"] .ag-header-cell-text')
  ).toHaveText(['ID', 'User', 'Host', 'Database', 'Command', 'Time', 'State', 'Info'])
})

test('lists database objects and distinguishes single from double click', async () => {
  await openTreeRow('database:seshat_lab')

  await expect(workspaceTabs().filter({ hasText: 'Database: seshat_lab' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(
    page.locator('[data-testid="database-grid"] .ag-header-cell-text')
  ).toHaveText(['Name', 'Rows', 'Size', 'Created at', 'Updated at', 'Engine', 'Comment', 'Type'])
  await expect(page.locator('[data-testid="database-grid"] .ag-row')).toHaveCount(5)
  await capture('database_seshat_lab')

  const firstRow = page.locator('[data-testid="database-grid"] .ag-row').first()
  await firstRow.dblclick()
  await expect(workspaceTabs().filter({ hasText: 'Data: customers' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(workspaceTabs().filter({ hasText: 'Table: customers' })).toHaveCount(0)

  await activateWorkspaceTab('Database: seshat_lab')
  await page.locator('[data-testid="database-grid"] .ag-row').first().click()
  await expect(workspaceTabs().filter({ hasText: 'Table: customers' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
})

test('walks every table section and opens the separate data tab', async () => {
  await activateWorkspaceTab('Table: customers')
  const tabs = structureTabs()
  await expect(tabs).toHaveCount(8)
  await expect(tabs).toHaveText([
    'Basic',
    'Options',
    'Indexes',
    'Foreign keys',
    'CHECK constraints',
    'Partitions',
    'CREATE code',
    'ALTER code'
  ])
  await capture('table_basic')

  await tabs.filter({ hasText: 'Indexes' }).click()
  await expect(page.locator('[data-testid="object-grid-indexes"] .ag-row')).not.toHaveCount(0)
  await capture('table_indexes')

  await tabs.filter({ hasText: 'Foreign keys' }).click()
  await expect(page.locator('[data-testid="object-grid-foreignKeys"]')).toBeVisible()

  await tabs.filter({ hasText: 'CHECK constraints' }).click()
  await expect(page.locator('[data-testid="object-grid-checks"]')).toBeVisible()

  await tabs.filter({ hasText: 'Partitions' }).click()
  await expect(page.locator('[data-testid="object-grid-partitions"]')).toBeVisible()

  await tabs.filter({ hasText: 'CREATE code' }).click()
  const createCode = page.locator('[data-testid="object-create-code"]')
  await expect(createCode.locator('.view-lines')).toContainText('CREATE TABLE')
  const before = await createCode.locator('.view-lines').innerText()
  await createCode.locator('.native-edit-context').focus()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' -- must not change')
  expect(await createCode.locator('.view-lines').innerText()).toBe(before)
  await capture('table_create_code')

  await tabs.filter({ hasText: 'ALTER code' }).click()
  await expect(page.locator('[data-testid="object-alter-code"] .view-lines')).toContainText(
    'ALTER TABLE'
  )

  await page.locator('.object-view__open-data').click()
  await expect(workspaceTabs().filter({ hasText: 'Data: customers' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(page.locator('[data-testid="data-grid"] .ag-row')).toHaveCount(4)
  await capture('data_customers')
})

test('keeps view and event structures aligned with HeidiSQL-style matrices', async () => {
  await openTreeRow('view:seshat_lab/v_customer_totals')
  await expect(workspaceTabs().filter({ hasText: 'View: v_customer_totals' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(structureTabs()).toHaveCount(4)
  await expect(page.locator('.object-view__open-data')).toBeVisible()
  await capture('view_structure')

  await openTreeRow('event:seshat_lab/ev_purge_sessions')
  await expect(workspaceTabs().filter({ hasText: 'Event: ev_purge_sessions' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(structureTabs()).toHaveCount(4)
  await expect(page.locator('.object-view__open-data')).toHaveCount(0)
  await capture('event_structure')
})

test('creates and closes query tabs, recreating the last one', async () => {
  await activateWorkspaceTab('Query 1')
  await page.locator('.workspace > .tabstrip .tabstrip__add').click()
  await expect(workspaceTabs().filter({ hasText: 'Query 2' })).toHaveAttribute(
    'aria-selected',
    'true'
  )

  await page.locator('[data-testid="new-query-trigger"]').click()
  await expect(workspaceTabs().filter({ hasText: 'Query 3' })).toHaveAttribute(
    'aria-selected',
    'true'
  )

  await page.locator('.workspace > .tabstrip .tabstrip__tab--active .tabstrip__close').click()
  await expect(workspaceTabs().filter({ hasText: 'Query 2' })).toHaveAttribute(
    'aria-selected',
    'true'
  )

  await page.locator('.workspace > .tabstrip .tabstrip__tab--active .tabstrip__close').click()
  await expect(workspaceTabs().filter({ hasText: 'Query 1' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await page.locator('.workspace > .tabstrip .tabstrip__tab--active .tabstrip__close').click()
  await expect(queryTabs()).toHaveCount(1)
  await expect(queryTabs().first()).toHaveText('Query 1')
  await expect(queryTabs().first()).toHaveAttribute('aria-selected', 'true')
})

test('restores only query tabs after a restart', async () => {
  await page.locator('.workspace > .tabstrip .tabstrip__add').click()
  await expect(workspaceTabs().filter({ hasText: 'Query 2' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await openTreeRow('connection:seshat-lab')
  await expect(workspaceTabs().filter({ hasText: 'Seshat Lab' })).toHaveAttribute(
    'aria-selected',
    'true'
  )

  await app.close()
  app = await launchApp({ dataDir })
  page = await app.firstWindow()
  await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor')
  await page.selectOption('[data-testid="locale-select"]', 'en-US')

  await expect(workspaceTabs()).toHaveCount(2)
  await expect(workspaceTabs().filter({ hasText: 'Query 1' })).toHaveCount(1)
  await expect(workspaceTabs().filter({ hasText: 'Query 2' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(workspaceTabs().filter({ hasText: 'Seshat Lab' })).toHaveCount(0)
})

test('keeps the global strip usable at the minimum window and in dark theme', async () => {
  await page.selectOption('[data-testid="theme-select"]', 'dark')
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.setSize(865, 480)
  })
  await expect
    .poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getSize()))
    .toEqual([865, 480])

  await expect(page.locator('.workspace > .tabstrip .tabstrip__add')).toBeVisible()
  const scroll = await page.evaluate(() => {
    const fits = (element: HTMLElement) =>
      element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight
    return { html: fits(document.documentElement), body: fits(document.body) }
  })
  expect(scroll).toEqual({ html: true, body: true })
  await capture('query_dark_865x480')

  await page.locator('[data-testid="theme-select"]').selectOption('light')
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.setSize(950, 600)
  })
})
