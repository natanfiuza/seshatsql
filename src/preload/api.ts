import type {
  ConnectionDeleteResult,
  ConnectionsSnapshot,
  ConnectionSaveResult
} from '../application/persistence/connections-service'
import type { ConnectionInput, PreferencesInput } from '../application/persistence/ipc-contract'
import type {
  PersistenceWarning,
  PreferencesV1,
  SaveResult,
  StartupState,
  TabsStateV1
} from '../domain/persistence/types'

export interface TabsLoadResult {
  readonly tabs: TabsStateV1
  readonly warnings: readonly PersistenceWarning[]
}

export interface CloseFailureInfo {
  readonly reason: string
}

/**
 * Surface exposed by the preload to the renderer.
 * Only named, validated methods belong here; never a generic invoke,
 * driver objects, or credentials (including ciphertext).
 */
export interface SeshatApi {
  readonly productName: string
  startup: () => Promise<StartupState>
  preferences: {
    get: () => Promise<PreferencesV1>
    set: (input: PreferencesInput) => Promise<SaveResult>
  }
  tabs: {
    load: () => Promise<TabsLoadResult>
    save: (state: TabsStateV1) => Promise<SaveResult>
    flush: (state: TabsStateV1) => Promise<SaveResult>
  }
  connections: {
    list: () => Promise<ConnectionsSnapshot>
    save: (input: ConnectionInput) => Promise<ConnectionSaveResult>
    delete: (input: { readonly id: string }) => Promise<ConnectionDeleteResult>
  }
  app: {
    onCloseRequested: (callback: () => void) => () => void
    onCloseFailed: (callback: (info: CloseFailureInfo) => void) => () => void
    replyClose: (reply: { readonly ok: boolean; readonly discard?: boolean }) => void
    requestClose: () => void
  }
}
