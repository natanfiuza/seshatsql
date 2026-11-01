import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import { launchApp } from './launch'

const CONNECTIONS_FILE = 'connections.yml'
const TABS_FILE = 'tabs_states.yml'

interface StartedApp {
  readonly app: ElectronApplication
  readonly page: Page
}

interface StoredProfile {
  id: string
  name: string
  color: string
  environment: string
  environmentLabel: string | null
  host: string
  port: number
  user: string
  password: { scheme: string; data: string } | null
}

interface StoredConnections {
  schemaVersion: number
  profiles: StoredProfile[]
}

interface ProfileOptions {
  readonly name: string
  readonly host?: string
  readonly port?: string
  readonly user?: string
  readonly password?: string
  readonly environment?: 'development' | 'staging' | 'production' | 'custom'
  readonly environmentLabel?: string
  readonly color?: string
}

async function start(dataDir: string): Promise<StartedApp> {
  const app = await launchApp({ dataDir })
  const page = await app.firstWindow()
  await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor')
  return { app, page }
}

async function closeWindow(app: ElectronApplication): Promise<void> {
  const closed = app.waitForEvent('close', { timeout: 20_000 })
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.close()
  })
  await closed
}

async function forceStop(app: ElectronApplication): Promise<void> {
  let child
  try {
    child = app.process()
  } catch {
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
  await page.locator('.monaco-editor .native-edit-context').focus()
  await page.keyboard.press('Control+End')
}

async function typeAtEnd(page: Page, text: string): Promise<void> {
  await revealEnd(page)
  await page.keyboard.type(text)
}

async function readConnections(dataDir: string): Promise<StoredConnections> {
  return (await parseYaml(
    await readFile(join(dataDir, CONNECTIONS_FILE), 'utf8')
  )) as StoredConnections
}

async function quarantineFiles(dataDir: string): Promise<string[]> {
  return (await readdir(dataDir)).filter((name) => name.includes('.corrupt-'))
}

async function openConnections(
  page: Page,
  source: 'toolbar' | 'menu',
  writable = true
): Promise<void> {
  if (source === 'toolbar') {
    await page.getByTestId('connections-trigger').click()
  } else {
    await page.getByRole('menuitem', { name: 'Tools', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Connections…' }).click()
  }
  await expect(page.getByRole('dialog')).toBeVisible()
  const save = page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true })
  if (writable) {
    await expect(save).toBeEnabled()
  } else {
    await expect(save).toBeDisabled()
  }
}

async function closeDialog(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

async function fillProfile(page: Page, options: ProfileOptions): Promise<void> {
  const dialog = page.getByRole('dialog')
  await dialog.locator('#connection-name').fill(options.name)
  await dialog.locator('#connection-host').fill(options.host ?? '127.0.0.1')
  await dialog.locator('#connection-port').fill(options.port ?? '3306')
  await dialog.locator('#connection-user').fill(options.user ?? 'root')
  if (options.password !== undefined) {
    await dialog.locator('#connection-password').fill(options.password)
  }
  const environment = options.environment ?? 'development'
  await dialog.locator('#connection-environment').selectOption(environment)
  if (environment === 'custom') {
    await dialog.locator('#connection-environment-label').fill(options.environmentLabel ?? 'Lab')
  }
  await dialog
    .locator(`input[name="connection-color"][value="${options.color ?? '#2563eb'}"]`)
    .check()
}

async function saveProfile(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
}

async function createProfile(page: Page, options: ProfileOptions): Promise<void> {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'New', exact: true }).click()
  await fillProfile(page, options)
  await saveProfile(page)
  await expect(
    dialog.locator('.connections__name').filter({ hasText: options.name.trim() })
  ).toHaveCount(1)
}

test('creates a profile from the Tools menu and restores it without connecting', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-create-'))
  const first = await start(dataDir)

  try {
    await openConnections(first.page, 'menu')
    await createProfile(first.page, {
      name: 'Chamados',
      host: 'db.local',
      port: '3307',
      user: 'seshat',
      password: 't04-secret',
      environment: 'staging',
      color: '#16a34a'
    })
    await closeDialog(first.page)
  } finally {
    await closeWindow(first.app).catch(() => forceStop(first.app))
  }

  const stored = await readConnections(dataDir)
  expect(stored.schemaVersion).toBe(2)
  expect(stored.profiles).toHaveLength(1)
  const profile = stored.profiles[0]
  expect(profile).toMatchObject({
    name: 'Chamados',
    color: '#16a34a',
    environment: 'staging',
    environmentLabel: null,
    host: 'db.local',
    port: 3307,
    user: 'seshat'
  })
  expect(profile?.id).toMatch(/^[0-9a-f-]{36}$/)
  expect(profile?.password?.scheme).toBe('dpapi')
  const fileText = await readFile(join(dataDir, CONNECTIONS_FILE), 'utf8')
  expect(fileText).not.toContain('t04-secret')

  const second = await start(dataDir)
  try {
    await openConnections(second.page, 'toolbar')
    const dialog = second.page.getByRole('dialog')
    await expect(dialog.locator('.connections__name')).toHaveText(['Chamados'])
    await expect(dialog.locator('#connection-name')).toHaveValue('Chamados')
    await expect(second.page.locator('.statusbar')).toContainText('Disconnected')
    await expect(second.page.locator('.sql-log')).toContainText('No queries executed.')
    await closeDialog(second.page)
  } finally {
    await closeWindow(second.app).catch(() => forceStop(second.app))
  }
})

test('editing without a password preserves the ciphertext byte for byte', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-keep-password-'))
  const { app, page } = await start(dataDir)

  try {
    await openConnections(page, 'toolbar')
    await createProfile(page, { name: 'Keep', password: 'preserve-me', color: '#7c3aed' })

    const before = await readConnections(dataDir)
    const ciphertext = before.profiles[0]?.password
    expect(ciphertext?.scheme).toBe('dpapi')

    await page.getByRole('dialog').locator('#connection-name').fill('Keep renamed')
    await saveProfile(page)
    await expect(page.getByRole('dialog').locator('.connections__name')).toHaveText([
      'Keep renamed'
    ])

    const after = await readConnections(dataDir)
    expect(after.profiles[0]?.password).toEqual(ciphertext)

    const decrypted = await app.evaluate(({ safeStorage }, data) => ({
      available: safeStorage.isEncryptionAvailable(),
      plaintext: safeStorage.decryptString(Buffer.from(data, 'base64'))
    }), ciphertext?.data ?? '')
    expect(decrypted).toEqual({ available: true, plaintext: 'preserve-me' })

    const listJson = await page.evaluate(async () =>
      JSON.stringify(
        await (
          window as unknown as {
            seshat: { connections: { list: () => Promise<unknown> } }
          }
        ).seshat.connections.list()
      )
    )
    expect(listJson).toContain('"hasPassword":true')
    expect(listJson).not.toContain('preserve-me')
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

test('removing the saved password writes null and hides the saved hint', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-remove-password-'))
  const { app, page } = await start(dataDir)

  try {
    await openConnections(page, 'toolbar')
    await createProfile(page, { name: 'SemSenha', password: 'temporary' })

    const dialog = page.getByRole('dialog')
    await dialog.locator('input[type="checkbox"]').check()
    await saveProfile(page)
    await expect(dialog.getByText('A password is saved for this connection.')).toHaveCount(0)

    expect((await readConnections(dataDir)).profiles[0]?.password).toBeNull()

    await closeDialog(page)
    await openConnections(page, 'toolbar')
    await expect(page.getByRole('dialog').locator('input[type="checkbox"]')).toHaveCount(0)
    await expect(
      page.getByRole('dialog').getByText('A password is saved for this connection.')
    ).toHaveCount(0)
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

test('rejects a duplicate name ignoring case and surrounding space', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-duplicate-'))
  const { app, page } = await start(dataDir)

  try {
    await openConnections(page, 'toolbar')
    await createProfile(page, { name: 'Local' })

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'New', exact: true }).click()
    await fillProfile(page, { name: '  local  ', host: 'other' })
    await saveProfile(page)

    await expect(
      dialog.getByRole('alert').filter({ hasText: 'already exists' })
    ).toBeVisible()
    await expect(dialog.locator('.connections__name')).toHaveText(['Local'])
    expect((await readConnections(dataDir)).profiles).toHaveLength(1)
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

test('deletes in two steps and leaves the tab SQL untouched', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-delete-'))
  const tabsPath = join(dataDir, TABS_FILE)
  const first = await start(dataDir)

  try {
    await typeAtEnd(first.page, ' -- t04_delete_marker')
    await first.page.waitForTimeout(900)
    await openConnections(first.page, 'toolbar')
    await createProfile(first.page, { name: 'Discardable' })

    const dialog = first.page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(dialog).toContainText('Delete “Discardable”?')
    await expect(dialog).toContainText('Tabs are kept')

    await dialog.getByRole('button', { name: 'Keep connection' }).click()
    await expect(dialog.getByText('Delete “Discardable”?')).toHaveCount(0)
    expect((await readConnections(dataDir)).profiles).toHaveLength(1)

    const tabsBefore = await readFile(tabsPath, 'utf8')
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await dialog.getByRole('button', { name: 'Delete connection' }).click()
    await expect(dialog.locator('.connections__empty')).toHaveText('No saved connections.')
    expect((await readConnections(dataDir)).profiles).toHaveLength(0)
    expect(await readFile(tabsPath, 'utf8')).toBe(tabsBefore)
    await closeDialog(first.page)
  } finally {
    await closeWindow(first.app).catch(() => forceStop(first.app))
  }

  const second = await start(dataDir)
  try {
    await revealEnd(second.page)
    await expect(second.page.locator('.monaco-editor .view-lines')).toContainText(
      '-- t04_delete_marker'
    )
    await expect(second.page.locator('.notice')).toHaveCount(0)
    await openConnections(second.page, 'toolbar')
    await expect(second.page.getByRole('dialog').locator('.connections__empty')).toHaveText(
      'No saved connections.'
    )
  } finally {
    await closeWindow(second.app).catch(() => forceStop(second.app))
  }
})

test('migrates a v1 file to v2 and preserves the original as a backup', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-migrate-'))
  const connectionsPath = join(dataDir, CONNECTIONS_FILE)
  const legacyText = `${stringifyYaml({
    schemaVersion: 1,
    profiles: [
      {
        id: 'legacy-a',
        name: 'Legacy',
        color: '#AABBCC',
        environment: 'Desenvolvimento',
        host: '127.0.0.1',
        port: 3306,
        user: '',
        password: null
      },
      {
        id: 'legacy-b',
        name: 'Legacy',
        color: '',
        environment: 'Laboratório',
        host: 'db.lab',
        port: 3307,
        user: 'root',
        password: null
      }
    ]
  })}`
  await writeFile(connectionsPath, legacyText, 'utf8')

  const { app, page } = await start(dataDir)
  try {
    await expect
      .poll(async () => {
        try {
          return (await readConnections(dataDir)).schemaVersion
        } catch {
          return 0
        }
      })
      .toBe(2)
    const stored = await readConnections(dataDir)
    expect(stored.profiles).toEqual([
      expect.objectContaining({
        id: 'legacy-a',
        environment: 'development',
        environmentLabel: null,
        color: '#aabbcc',
        user: ''
      }),
      expect.objectContaining({
        id: 'legacy-b',
        environment: 'custom',
        environmentLabel: 'Laboratório',
        color: '#2563eb'
      })
    ])
    expect(await readFile(`${connectionsPath}.bak`, 'utf8')).toBe(legacyText)
    expect(await quarantineFiles(dataDir)).toHaveLength(0)

    // The migration happens while startup loads the file, so its warning is
    // carried by the shell banner rather than by the later read in the dialog.
    await expect(page.locator('.notice')).toContainText('older file was migrated')
    await openConnections(page, 'toolbar')
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.connections__name')).toHaveText(['Legacy', 'Legacy'])
    await expect(dialog.locator('.connections__meta').nth(0)).toContainText('Development')
    await expect(dialog.locator('.connections__meta').nth(1)).toContainText('Laboratório')
    await closeDialog(page)
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

test('opens a damaged connections file with a localized warning', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-corrupt-'))
  await writeFile(join(dataDir, CONNECTIONS_FILE), 'profiles: [unterminated\n', 'utf8')

  const { app, page } = await start(dataDir)
  try {
    // Quarantine happens during startup, so the localized warning is in the
    // shell banner; the dialog still opens with the recovered empty state.
    await expect(page.locator('.notice')).toContainText('damaged file was preserved in quarantine')
    await openConnections(page, 'toolbar')
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.connections__empty')).toHaveText('No saved connections.')
    await expect.poll(() => quarantineFiles(dataDir)).toHaveLength(1)
    await closeDialog(page)
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

test('refuses to write a future connections version and keeps its bytes', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-future-'))
  const connectionsPath = join(dataDir, CONNECTIONS_FILE)
  const future = 'schemaVersion: 3\nprofiles: []\n'
  await writeFile(connectionsPath, future, 'utf8')

  const { app, page } = await start(dataDir)
  try {
    await openConnections(page, 'toolbar', false)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('written by a newer version')
    await expect(dialog).toContainText('(v3)')
    await expect(dialog).toContainText('Connection profiles cannot be changed')
    await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'New', exact: true })).toBeDisabled()
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }

  expect(await readFile(connectionsPath, 'utf8')).toBe(future)
  expect(await quarantineFiles(dataDir)).toHaveLength(0)
})

test('validates required fields, the port range and the custom label inline', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'seshat-t04-validation-'))
  const { app, page } = await start(dataDir)

  try {
    await openConnections(page, 'toolbar')
    const dialog = page.getByRole('dialog')

    await saveProfile(page)
    await expect(dialog.getByText('Required.')).toHaveCount(3)
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('connection-name')

    await dialog.locator('#connection-name').fill('Validation')
    await dialog.locator('#connection-host').fill('localhost')
    await dialog.locator('#connection-user').fill('root')
    await dialog.locator('#connection-port').fill('0')
    await saveProfile(page)
    await expect(dialog.getByText('Use a port from 1 to 65535.')).toBeVisible()
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('connection-port')

    await dialog.locator('#connection-port').fill('3306')
    await dialog.locator('#connection-environment').selectOption('custom')
    await saveProfile(page)
    await expect(dialog.getByText('Describe the custom environment.')).toBeVisible()
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      'connection-environment-label'
    )

    await dialog.locator('#connection-environment-label').fill('Experiment')
    await saveProfile(page)
    await expect(dialog.locator('.connections__name')).toHaveText(['Validation'])

    expect((await readConnections(dataDir)).profiles[0]).toMatchObject({
      name: 'Validation',
      environment: 'custom',
      environmentLabel: 'Experiment',
      port: 3306
    })
  } finally {
    await closeWindow(app).catch(() => forceStop(app))
  }
})

