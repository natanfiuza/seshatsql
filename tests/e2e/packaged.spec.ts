import { existsSync } from 'node:fs'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

import { launchApp } from './launch'

const EXECUTABLE = join(process.cwd(), 'dist', 'win-unpacked', 'SeshatSQL.exe')

test.skip(!existsSync(EXECUTABLE), 'run `npm run pack:win` before the packaged end-to-end test')

test('the packaged app opens the editor and the grid without a dev server', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'seshat-packaged-'))
  const requestLogPath = join(directory, 'requests.log')
  const app = await launchApp({ executablePath: EXECUTABLE, requestLog: requestLogPath })

  try {
    const page = await app.firstWindow()

    await expect(page).toHaveTitle('SeshatSQL')
    await page.waitForSelector('[data-testid="monaco-editor"] .monaco-editor', { timeout: 30_000 })
    await expect(page.locator('[data-testid="result-grid"] .ag-row')).toHaveCount(4)
    expect(await page.url()).toBe('app://seshat/index.html')
    expect(
      await page.locator('[data-testid="monaco-editor"]').getAttribute('data-language')
    ).toBe('mysql')

    // The strict policy must arrive as a response header on the packaged HTML.
    const csp = await page.evaluate(async () => {
      const response = await fetch('app://seshat/index.html')
      return response.headers.get('content-security-policy')
    })
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("worker-src 'self'")
    expect(csp).not.toContain('ws://')
  } finally {
    await app.close()
  }

  const lines = (await readFile(requestLogPath, 'utf8')).trim().split('\n').filter(Boolean)
  expect(lines.length).toBeGreaterThan(0)
  for (const line of lines) {
    const url = line.split(' ')[2] ?? ''
    expect(url, `unexpected request: ${line}`).toMatch(/^app:\/\/seshat\//)
  }
})
