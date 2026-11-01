import { existsSync } from 'node:fs'
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { parse as parseYaml } from 'yaml'

import { launchApp } from './launch'

const PREFERENCES_FILE = 'preferences.yml'
const TABS_FILE = 'tabs_states.yml'
const CONNECTIONS_FILE = 'connections.yml'

interface StartedApp {
  readonly app: ElectronApplication
  readonly page: Page
}

async function start(dataDir: string): Promise<StartedApp> {
  const app = await launchApp({ dataDir })
  const page = await app.firstWindow()
  await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor')
  return { app, page }
}

/** Closes through the real window handshake, so pending state is flushed. */
async function closeWindow(app: ElectronApplication): Promise<void> {
  const closed = app.waitForEvent('close', { timeout: 20_000 })
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.close()
  })
  await closed
}

/** Guarantees the process is gone even when a test fails midway. */
async function forceStop(app: ElectronApplication): Promise<void> {
  let child
  try {
    child = app.process()
  } catch {
    // Playwright already detached the connection after a normal close.
    return
  }
  if (child.exitCode !== null || child.signalCode !== null) {
    return
  }
  const closed = app.waitForEvent('close', { timeout: 5_000 }).catch(() => undefined)
  child.kill()
  await closed
}

async function revealEnd(page: Page): Promise<void> {
  // Monaco virtualizes the viewport: lines scrolled out of view are not in the
  // DOM, so move the caret to the end before asserting on the last line.
  await page.locator('.monaco-editor .native-edit-context').focus()
  await page.keyboard.press('Control+End')
}

async function typeAtEnd(page: Page, text: string): Promise<void> {
  // Monaco 0.57 edits through the EditContext element; the decoration overlay
  // intercepts clicks on the rendered lines, so focus the input directly.
  await revealEnd(page)
  await page.keyboard.type(text)
}

async function readYaml(path: string): Promise<unknown> {
  return parseYaml(await readFile(path, 'utf8'))
}

async function quarantineFiles(dataDir: string): Promise<string[]> {
  const entries = await readdir(dataDir)
  // Both the primary and its backup can be quarantined, so match any name.
  return entries.filter((name) => name.includes('.corrupt-'))
}

test('the first run creates the three versioned files', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-first-'))
  const { app, page } = await start(dataDir)

  try {
    for (const file of [PREFERENCES_FILE, TABS_FILE, CONNECTIONS_FILE]) {
      await expect.poll(() => existsSync(join(dataDir, file))).toBe(true)
    }

    expect(await readYaml(join(dataDir, PREFERENCES_FILE))).toEqual({
      schemaVersion: 1,
      theme: 'system',
      locale: 'en-US'
    })
    expect(await readYaml(join(dataDir, CONNECTIONS_FILE))).toEqual({
      schemaVersion: 2,
      profiles: []
    })

    // The shell schedules its first tab save after the 500 ms debounce.
    await expect
      .poll(async () => {
        const tabs = (await readYaml(join(dataDir, TABS_FILE))) as {
          tabs?: { text?: string }[]
        }
        return tabs.tabs?.length ?? 0
      })
      .toBe(1)

    await expect(page.locator('.notice')).toHaveCount(0)
  } finally {
    await forceStop(app)
  }
})

test('restart restores theme, language and editor text without connecting', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-restart-'))
  const first = await start(dataDir)

  try {
    await first.page.selectOption('[data-testid="theme-select"]', 'dark')
    await first.page.selectOption('[data-testid="locale-select"]', 'pt-BR')
    await expect
      .poll(async () => readYaml(join(dataDir, PREFERENCES_FILE)))
      .toEqual({ schemaVersion: 1, theme: 'dark', locale: 'pt-BR' })

    await typeAtEnd(first.page, ' -- persisted_marker')
    await expect(first.page.locator('.monaco-editor .view-lines')).toContainText(
      '-- persisted_marker'
    )
    // Give the 500 ms debounce time to write the tab state.
    await first.page.waitForTimeout(900)
  } finally {
    await closeWindow(first.app).catch(() => forceStop(first.app))
  }

  const tabs = (await readYaml(join(dataDir, TABS_FILE))) as { tabs?: { text?: string }[] }
  expect(tabs.tabs?.[0]?.text).toContain('-- persisted_marker')

  const second = await start(dataDir)
  try {
    await expect
      .poll(() => second.page.evaluate(() => document.documentElement.dataset.theme))
      .toBe('dark')
    await expect(second.page.locator('.menubar__button').first()).toHaveText('Arquivo')
    await revealEnd(second.page)
    await expect(second.page.locator('.monaco-editor .view-lines')).toContainText(
      '-- persisted_marker'
    )
    // Restoring a tab must not open a connection or execute SQL.
    await expect(second.page.locator('.statusbar')).toContainText('Desconectado')
    await expect(second.page.locator('.sql-log')).toContainText('Nenhuma consulta executada.')
    await expect(second.page.locator('.notice')).toHaveCount(0)
  } finally {
    await closeWindow(second.app).catch(() => forceStop(second.app))
  }
})

test('a damaged primary file is quarantined and the backup is restored', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-recovery-'))
  const first = await start(dataDir)

  try {
    await typeAtEnd(first.page, ' -- from_backup_marker')
    await first.page.waitForTimeout(900)
    await typeAtEnd(first.page, ' -- second_marker')
    await first.page.waitForTimeout(900)
  } finally {
    await closeWindow(first.app).catch(() => forceStop(first.app))
  }

  const tabsPath = join(dataDir, TABS_FILE)
  const backupText = await readFile(`${tabsPath}.bak`, 'utf8')
  expect(backupText).toContain('-- from_backup_marker')
  await writeFile(tabsPath, 'broken: [unterminated\n')

  const second = await start(dataDir)
  try {
    const notice = second.page.locator('.notice')
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('damaged file was preserved in quarantine')
    await expect(notice).toContainText('The main file was damaged')
    await expect(
      notice.locator('.notice__path').filter({ hasText: TABS_FILE }).first()
    ).toBeVisible()

    await expect
      .poll(() => quarantineFiles(dataDir))
      .toHaveLength(1)

    await revealEnd(second.page)
    await expect(second.page.locator('.monaco-editor .view-lines')).toContainText(
      '-- from_backup_marker'
    )

    await second.page.getByRole('button', { name: 'Dismiss' }).click()
    await expect(second.page.locator('.notice')).toHaveCount(0)
  } finally {
    await closeWindow(second.app).catch(() => forceStop(second.app))
  }
})

test('two damaged files fall back to defaults with both quarantined', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-invalid-'))
  const tabsPath = join(dataDir, TABS_FILE)
  await writeFile(tabsPath, 'schemaVersion: [not\n')
  await writeFile(`${tabsPath}.bak`, 'not: [valid\n')

  const { app, page } = await start(dataDir)
  try {
    const notice = page.locator('.notice')
    await expect(notice).toContainText('Default settings are in use')
    await expect(notice).toContainText('damaged file was preserved in quarantine')
    await expect.poll(() => quarantineFiles(dataDir)).toHaveLength(2)

    // The shell still starts with the sample tab from the defaults.
    await expect(page.locator('[data-testid="monaco-editor"] .monaco-editor')).toBeVisible()
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

test('a file from a newer version is never overwritten and a failed close keeps the window', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-future-'))
  const tabsPath = join(dataDir, TABS_FILE)
  const original = [
    'schemaVersion: 2',
    'activeTabId: future-tab',
    'tabs:',
    '  - id: future-tab',
    '    title: Future',
    '    text: SELECT 1;',
    '    connectionId: null',
    '    database: null',
    '    order: 0',
    '    cursor: null',
    '    selection: null'
  ].join('\n')
  await writeFile(tabsPath, original)

  const { app, page } = await start(dataDir)
  try {
    const notice = page.locator('.notice')
    await expect(notice).toContainText('written by a newer version')
    await expect(notice).toContainText('(v2)')

    // The initial tab save is refused by the future-version guard, which the
    // banner reports as a refused save (Retry) instead of a generic failure.
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible({ timeout: 5_000 })

    const closed = app.waitForEvent('close', { timeout: 3_000 }).catch(() => undefined)
    await app.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.close()
    })
    await closed
    await expect(notice).toContainText('Could not save before closing. The window stays open.')
    expect(
      await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)
    ).toBe(1)

    await page.getByRole('button', { name: 'Exit without saving' }).click()
    await expect(notice).toContainText('Discard unsaved changes and exit?')
    const discarded = app.waitForEvent('close', { timeout: 10_000 })
    // The click closes the window, so Playwright may observe the page going
    // away before the action resolves; the close event is the real assertion.
    await page
      .getByRole('button', { name: 'Exit', exact: true })
      .click()
      .catch(() => undefined)
    await discarded
  } finally {
    await forceStop(app)
  }

  expect(await readFile(tabsPath, 'utf8')).toBe(original)
  expect(await quarantineFiles(dataDir)).toHaveLength(0)
})

test('passwords are stored as DPAPI ciphertext and never reach the renderer', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-dpapi-'))
  const first = await start(dataDir)
  let profileId = ''

  try {
    const saved = await first.page.evaluate(() =>
      (
        window as unknown as {
          seshat: {
            connections: {
              save: (input: Record<string, unknown>) => Promise<{
                ok: boolean
                profile?: { id: string; hasPassword: boolean }
              }>
            }
          }
        }
      ).seshat.connections.save({
        name: 'Local',
        color: '#2563eb',
        environment: 'development',
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'e2e-secret'
      })
    )
    expect(saved).toMatchObject({ ok: true, profile: { hasPassword: true } })
    profileId = saved.profile?.id ?? ''
    expect(profileId.length).toBeGreaterThan(0)

    const listJson = await first.page.evaluate(async () =>
      JSON.stringify(
        await (
          window as unknown as {
            seshat: { connections: { list: () => Promise<unknown> } }
          }
        ).seshat.connections.list()
      )
    )
    expect(listJson).toContain('"hasPassword":true')
    expect(listJson).not.toContain('e2e-secret')

    const fileText = await readFile(join(dataDir, CONNECTIONS_FILE), 'utf8')
    expect(fileText).not.toContain('e2e-secret')

    const stored = (await readYaml(join(dataDir, CONNECTIONS_FILE))) as {
      profiles: { password: { scheme: string; data: string } }[]
    }
    const secret = stored.profiles[0]?.password
    expect(secret?.scheme).toBe('dpapi')
    expect(typeof secret?.data).toBe('string')

    const decrypted = await first.app.evaluate(({ safeStorage }, data) => {
      return {
        available: safeStorage.isEncryptionAvailable(),
        plaintext: safeStorage.decryptString(Buffer.from(data, 'base64'))
      }
    }, secret?.data ?? '')
    expect(decrypted).toEqual({ available: true, plaintext: 'e2e-secret' })
  } finally {
    await closeWindow(first.app).catch(() => forceStop(first.app))
  }

  // The ciphertext survives a restart and the renderer still only sees a flag.
  const second = await start(dataDir)
  try {
    const listJson = await second.page.evaluate(async () =>
      JSON.stringify(
        await (
          window as unknown as {
            seshat: { connections: { list: () => Promise<unknown> } }
          }
        ).seshat.connections.list()
      )
    )
    expect(listJson).toContain(`"id":"${profileId}"`)
    expect(listJson).toContain('"hasPassword":true')
    expect(listJson).not.toContain('e2e-secret')
  } finally {
    await closeWindow(second.app).catch(() => forceStop(second.app))
  }
})

test('a hard kill after the debounce still restores the typed text', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-s06-crash-'))
  const first = await start(dataDir)

  await typeAtEnd(first.page, ' -- crash_marker')
  await first.page.waitForTimeout(1_000)

  const closed = first.app.waitForEvent('close', { timeout: 10_000 }).catch(() => undefined)
  first.app.process().kill()
  await closed

  const second = await start(dataDir)
  try {
    await revealEnd(second.page)
    await expect(second.page.locator('.monaco-editor .view-lines')).toContainText('-- crash_marker')
  } finally {
    await closeWindow(second.app).catch(() => forceStop(second.app))
  }
})
