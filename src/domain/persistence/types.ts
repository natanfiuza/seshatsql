/**
 * Persistence model shared by the main process, the preload and the tests.
 * Pure types and constants: no Node, Electron or Vue dependency.
 */

export const PERSISTENCE_SCHEMA_VERSION = 1

export const PERSISTED_THEMES = ['system', 'light', 'dark'] as const

export type PersistedTheme = (typeof PERSISTED_THEMES)[number]

export const PERSISTED_LOCALES = ['en-US', 'pt-BR', 'pt-PT', 'fr', 'es'] as const

export type PersistedLocale = (typeof PERSISTED_LOCALES)[number]

export interface PreferencesV1 {
  readonly schemaVersion: 1
  readonly theme: PersistedTheme
  readonly locale: PersistedLocale
}

export interface PersistedCursor {
  readonly lineNumber: number
  readonly column: number
}

export interface PersistedSelection {
  readonly startLineNumber: number
  readonly startColumn: number
  readonly endLineNumber: number
  readonly endColumn: number
}

export interface PersistedTab {
  readonly id: string
  readonly title: string
  readonly text: string
  readonly connectionId: string | null
  readonly database: string | null
  readonly order: number
  readonly cursor: PersistedCursor | null
  readonly selection: PersistedSelection | null
}

export interface TabsStateV1 {
  readonly schemaVersion: 1
  readonly activeTabId: string | null
  readonly tabs: readonly PersistedTab[]
}

export interface PersistedSecret {
  readonly scheme: 'dpapi'
  readonly data: string
}

export interface PersistedConnection {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly environment: string
  readonly host: string
  readonly port: number
  readonly user: string
  readonly password: PersistedSecret | null
}

export interface ConnectionsV1 {
  readonly schemaVersion: 1
  readonly profiles: readonly PersistedConnection[]
}

/** Connection metadata that is safe to send to the renderer. */
export interface PublicConnection {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly environment: string
  readonly host: string
  readonly port: number
  readonly user: string
  readonly hasPassword: boolean
}

export type PersistenceWarningCode =
  | 'recovered-from-backup'
  | 'quarantined'
  | 'quarantine-failed'
  | 'future-version'
  | 'migrated'
  | 'large-file'
  | 'file-too-large'
  | 'read-failed'
  | 'defaults-used'
  | 'legacy-directory'
  | 'save-failed'

/**
 * A warning carries a stable code and the affected paths, never file contents.
 * The renderer translates the code; the main process never builds UI text.
 */
export interface PersistenceWarning {
  readonly code: PersistenceWarningCode
  readonly paths: readonly string[]
  readonly version?: number
}

export type ParseOutcome<T> =
  | { readonly status: 'valid'; readonly value: T }
  | { readonly status: 'future'; readonly version: number; readonly raw: unknown }
  | { readonly status: 'older'; readonly version: number; readonly raw: unknown }
  | { readonly status: 'invalid'; readonly issues: readonly string[] }

export interface LoadedPersistence<T> {
  /** "defaults" means the stored value was absent or unusable. */
  readonly status: 'loaded' | 'defaults'
  readonly value: T
  readonly missing: boolean
  readonly warnings: readonly PersistenceWarning[]
}

export type SaveFailureReason =
  | 'invalid'
  | 'readonly-newer'
  | 'read-failed'
  | 'file-too-large'
  | 'io-error'

export type SaveResult = { readonly ok: true } | { readonly ok: false; readonly reason: SaveFailureReason }

export interface StartupState {
  readonly dataDirectory: string
  readonly preferences: PreferencesV1
  readonly tabs: TabsStateV1
  readonly warnings: readonly PersistenceWarning[]
}

export const DEFAULT_PREFERENCES: PreferencesV1 = {
  schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  theme: 'system',
  locale: 'en-US'
}

export const EMPTY_TABS: TabsStateV1 = {
  schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  activeTabId: null,
  tabs: []
}

export const EMPTY_CONNECTIONS: ConnectionsV1 = {
  schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  profiles: []
}
