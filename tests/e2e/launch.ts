import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { _electron as electron, type ElectronApplication } from '@playwright/test'

/**
 * Launches Electron with the current environment minus ELECTRON_RUN_AS_NODE.
 * That variable makes Electron behave as plain Node, so the app never windows;
 * it is commonly inherited from Node-based terminals and CI wrappers.
 */
function appEnvironment(extra: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== 'ELECTRON_RUN_AS_NODE') {
      env[key] = value
    }
  }
  return { ...env, ...extra }
}

export interface LaunchOptions {
  /** Packaged executable; when omitted the local build in out/ is launched. */
  executablePath?: string
  /** File that receives the request log (SESHAT_REQUEST_LOG). */
  requestLog?: string
  /**
   * Persistence directory. A fresh temporary directory is used by default so
   * end-to-end runs never touch the real user profile.
   */
  dataDir?: string
  /**
   * Electron userData directory. A fresh temporary directory per launch keeps
   * concurrent test instances from sharing the Chromium process singleton.
   */
  userDataDir?: string
}

export function launchApp(options: LaunchOptions = {}): Promise<ElectronApplication> {
  const extra: Record<string, string> = {
    SESHAT_DATA_DIR: options.dataDir ?? mkdtempSync(join(tmpdir(), 'seshat-data-')),
    SESHAT_USER_DATA_DIR: options.userDataDir ?? mkdtempSync(join(tmpdir(), 'seshat-userdata-'))
  }
  if (options.requestLog !== undefined) {
    extra['SESHAT_REQUEST_LOG'] = options.requestLog
  }
  const env = appEnvironment(extra)

  if (options.executablePath === undefined) {
    return electron.launch({ args: ['.'], env })
  }

  return electron.launch({ executablePath: options.executablePath, env })
}
