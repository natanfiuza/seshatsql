import type {
  PersistenceWarning,
  PersistenceWarningCode
} from '../../../domain/persistence/types'

/**
 * Maps a stable warning code from the main process to its catalog key.
 * The main process never builds UI text; only codes and paths cross the IPC.
 */
const WARNING_KEYS: Record<PersistenceWarningCode, string> = {
  'recovered-from-backup': 'persistence.warning.recovered',
  quarantined: 'persistence.warning.quarantined',
  'quarantine-failed': 'persistence.warning.quarantineFailed',
  'future-version': 'persistence.warning.futureVersion',
  migrated: 'persistence.warning.migrated',
  'large-file': 'persistence.warning.largeFile',
  'file-too-large': 'persistence.warning.fileTooLarge',
  'read-failed': 'persistence.warning.readFailed',
  'defaults-used': 'persistence.warning.defaultsUsed',
  'legacy-directory': 'persistence.warning.legacyDirectory',
  'save-failed': 'persistence.warning.saveFailed'
}

export function warningMessageKey(code: PersistenceWarningCode): string {
  return WARNING_KEYS[code]
}

export interface WarningView {
  /** Stable key for rendering; repeated warnings about the same paths collapse. */
  readonly id: string
  readonly messageKey: string
  readonly paths: readonly string[]
  readonly version: number | null
}

export function toWarningViews(warnings: readonly PersistenceWarning[]): WarningView[] {
  const seen = new Set<string>()
  const views: WarningView[] = []

  for (const warning of warnings) {
    const version = warning.version ?? null
    const id = `${warning.code}|${warning.paths.join('|')}|${version ?? ''}`
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    views.push({
      id,
      messageKey: warningMessageKey(warning.code),
      paths: warning.paths,
      version
    })
  }

  return views
}
