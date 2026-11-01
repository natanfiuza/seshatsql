import { stat } from 'node:fs/promises'

import {
  ipcMain,
  type BrowserWindow,
  type IpcMainInvokeEvent
} from 'electron'
import type { ZodType } from 'zod'

import { ConnectionsService } from '../application/persistence/connections-service'
import {
  connectionIdSchema,
  connectionInputSchema,
  IPC_CHANNELS,
  preferencesInputSchema
} from '../application/persistence/ipc-contract'
import type { PersistenceStore } from '../application/persistence/store'
import { migrateConnectionsV1ToV2 } from '../domain/persistence/connections-migration'
import {
  connectionsCodec,
  preferencesCodec,
  tabsStateCodec,
  tabsStateSchema
} from '../domain/persistence/schemas'
import {
  DEFAULT_PREFERENCES,
  EMPTY_CONNECTIONS,
  EMPTY_TABS,
  PERSISTENCE_SCHEMA_VERSION,
  type ConnectionsV2,
  type LoadedPersistence,
  type PersistenceWarning,
  type PreferencesV1,
  type StartupState,
  type TabsStateV1
} from '../domain/persistence/types'
import { ElectronSecretProtector } from '../infrastructure/persistence/electron-secret-protector'
import {
  resolveDataDirectory,
  resolveLegacyDataDirectory,
  resolvePersistencePaths
} from '../infrastructure/persistence/data-directory'
import { YamlFileStore } from '../infrastructure/persistence/yaml-file-store'
import { isTrustedRendererUrl } from './ipc-guard'

export interface PersistenceRuntime {
  readonly startup: StartupState
  /**
   * Registers named IPC handlers. The returned function removes them, which
   * keeps repeated window creation from stacking handlers.
   */
  installIpc: (
    getWindow: () => BrowserWindow | null,
    devRendererUrl?: string
  ) => () => void
}

export interface PersistenceOptions {
  readonly home: string
  /** Test-only override; never exposed to the renderer. */
  readonly dataDirectory?: string
}

async function prepare<T>(
  store: PersistenceStore<T> & { isWriteBlocked: () => boolean },
  filePath: string
): Promise<LoadedPersistence<T>> {
  const loaded = await store.load()
  const warnings = [...loaded.warnings]
  const recovered = loaded.warnings.some((warning) => warning.code === 'recovered-from-backup')
  const wantsRewrite = loaded.status === 'defaults' || recovered

  if (wantsRewrite && !store.isWriteBlocked()) {
    const saved = await store.save(loaded.value)
    if (!saved.ok) {
      warnings.push({ code: 'save-failed', paths: [filePath] })
    }
  }

  return { ...loaded, warnings }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export async function createPersistenceRuntime(
  options: PersistenceOptions
): Promise<PersistenceRuntime> {
  const dataDirectory = options.dataDirectory ?? resolveDataDirectory(options.home)
  const paths = resolvePersistencePaths(dataDirectory)

  const preferencesStore = new YamlFileStore<PreferencesV1>({
    filePath: paths.preferences,
    codec: preferencesCodec,
    defaults: DEFAULT_PREFERENCES
  })
  const tabsStore = new YamlFileStore<TabsStateV1>({
    filePath: paths.tabs,
    codec: tabsStateCodec,
    defaults: EMPTY_TABS
  })
  const connectionsStore = new YamlFileStore<ConnectionsV2>({
    filePath: paths.connections,
    codec: connectionsCodec,
    defaults: EMPTY_CONNECTIONS,
    migrations: { 1: migrateConnectionsV1ToV2 }
  })

  const [preferencesLoaded, tabsLoaded, connectionsLoaded] = await Promise.all([
    prepare(preferencesStore, paths.preferences),
    prepare(tabsStore, paths.tabs),
    prepare(connectionsStore, paths.connections)
  ])

  const warnings: PersistenceWarning[] = [
    ...preferencesLoaded.warnings,
    ...tabsLoaded.warnings,
    ...connectionsLoaded.warnings
  ]

  const legacyDirectory = resolveLegacyDataDirectory(options.home)
  if (await pathExists(legacyDirectory)) {
    warnings.push({ code: 'legacy-directory', paths: [legacyDirectory] })
  }

  let currentPreferences = preferencesLoaded.value
  let currentTabs = tabsLoaded.value

  const connections = new ConnectionsService(connectionsStore, new ElectronSecretProtector())

  const startup: StartupState = {
    dataDirectory,
    preferences: currentPreferences,
    tabs: currentTabs,
    warnings
  }

  function requireWindow(event: IpcMainInvokeEvent, getWindow: () => BrowserWindow | null): BrowserWindow {
    const window = getWindow()
    const frame = event.senderFrame
    if (
      window === null ||
      event.sender !== window.webContents ||
      frame === null ||
      frame !== window.webContents.mainFrame
    ) {
      throw new Error('ipc:untrusted-sender')
    }
    return window
  }

  function installIpc(
    getWindow: () => BrowserWindow | null,
    devRendererUrl?: string
  ): () => void {
    const channels: string[] = []

    function register<Input, Output>(
      channel: string,
      schema: ZodType<Input> | null,
      handler: (input: Input, window: BrowserWindow) => Promise<Output> | Output
    ): void {
      channels.push(channel)
      ipcMain.handle(channel, async (event, raw: unknown) => {
        const window = requireWindow(event, getWindow)
        const frame = event.senderFrame
        if (frame === null || !isTrustedRendererUrl(frame.url, devRendererUrl)) {
          throw new Error('ipc:untrusted-origin')
        }
        let input = raw as Input
        if (schema !== null) {
          const parsed = schema.safeParse(raw)
          if (!parsed.success) {
            return { ok: false, reason: 'invalid' }
          }
          input = parsed.data
        }
        try {
          return await handler(input, window)
        } catch {
          return { ok: false, reason: 'internal' }
        }
      })
    }

    register(IPC_CHANNELS.startup, null, () => startup)
    register(IPC_CHANNELS.preferencesGet, null, () => currentPreferences)
    register(IPC_CHANNELS.preferencesSet, preferencesInputSchema, async (input) => {
      const value: PreferencesV1 = { schemaVersion: PERSISTENCE_SCHEMA_VERSION, ...input }
      const result = await preferencesStore.save(value)
      if (result.ok) {
        currentPreferences = value
      }
      return result
    })
    register(IPC_CHANNELS.tabsLoad, null, async () => {
      const loaded = await tabsStore.load()
      return { tabs: loaded.value, warnings: loaded.warnings }
    })
    register(IPC_CHANNELS.tabsSave, tabsStateSchema, async (input: TabsStateV1) => {
      const result = await tabsStore.save(input)
      if (result.ok) {
        currentTabs = input
      }
      return result
    })
    register(IPC_CHANNELS.tabsFlush, tabsStateSchema, async (input: TabsStateV1) => {
      const result = await tabsStore.save(input)
      if (result.ok) {
        currentTabs = input
      }
      return result
    })
    register(IPC_CHANNELS.connectionsList, null, async () => {
      try {
        return await connections.list()
      } catch {
        return {
          profiles: [],
          warnings: [{ code: 'read-failed' as const, paths: [paths.connections] }]
        }
      }
    })
    register(IPC_CHANNELS.connectionsSave, connectionInputSchema, async (input) => {
      return connections.save(input)
    })
    register(IPC_CHANNELS.connectionsDelete, connectionIdSchema, async (input) => {
      return connections.delete(input.id)
    })

    return () => {
      for (const channel of channels) {
        ipcMain.removeHandler(channel)
      }
    }
  }

  return { startup, installIpc }
}
