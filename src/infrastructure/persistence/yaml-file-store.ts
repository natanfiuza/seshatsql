import { mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import type { VersionedCodec } from '../../domain/persistence/schemas'
import type {
  LoadedPersistence,
  ParseOutcome,
  PersistenceWarning,
  SaveFailureReason,
  SaveResult
} from '../../domain/persistence/types'

const DEFAULT_WARN_BYTES = 1024 * 1024
const DEFAULT_MAX_BYTES = 16 * 1024 * 1024
const RENAME_DELAYS_MS = [0, 15, 40, 100] as const

export interface YamlFileStoreOptions<T> {
  readonly filePath: string
  readonly codec: VersionedCodec<T>
  readonly defaults: T
  /** Keyed by the version found in the file. No migration ships in v1. */
  readonly migrations?: Readonly<Record<number, (raw: unknown) => unknown>>
  readonly warnBytes?: number
  readonly maxBytes?: number
  readonly now?: () => Date
  /** Test seam for the Windows rename retry path. */
  readonly renameFile?: (from: string, to: string) => Promise<void>
}

type ReadOutcome<T> =
  | { readonly status: 'missing' }
  | { readonly status: 'unreadable'; readonly code: string }
  | { readonly status: 'too-large'; readonly bytes: number }
  | {
      readonly status: 'parsed'
      readonly outcome: ParseOutcome<T>
      readonly bytes: number
      readonly text: string
    }

interface Accepted<T> {
  readonly value: T
  readonly migrated: boolean
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code
    if (typeof code === 'string') {
      return code
    }
  }
  return 'unknown'
}

function isRetriableRenameError(error: unknown): boolean {
  const code = errorCode(error)
  return code === 'EPERM' || code === 'EBUSY'
}

function sleep(ms: number): Promise<void> {
  return ms === 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldQuarantine<T>(read: ReadOutcome<T>): boolean {
  if (read.status !== 'parsed') {
    return false
  }
  return read.outcome.status === 'invalid' || read.outcome.status === 'older'
}

function isFuture<T>(read: ReadOutcome<T>): boolean {
  return read.status === 'parsed' && read.outcome.status === 'future'
}

async function safeUnlink(path: string): Promise<void> {
  try {
    await unlink(path)
  } catch {
    // Best effort: a leftover tmp file is never used as the primary.
  }
}

/**
 * Versioned YAML file with the recovery contract:
 * primary -> last valid backup -> quarantine; writes go through tmp+fsync,
 * copy the current valid file to .bak and rename the tmp over the primary.
 * A failed rename aborts the save instead of falling back to a direct write.
 */
export class YamlFileStore<T> {
  private readonly codec: VersionedCodec<T>
  private readonly defaults: T
  private readonly filePath: string
  private readonly backupPath: string
  private readonly migrations: Readonly<Record<number, (raw: unknown) => unknown>>
  private readonly warnBytes: number
  private readonly maxBytes: number
  private readonly clock: () => Date
  private readonly renameImpl: (from: string, to: string) => Promise<void>

  private tail: Promise<unknown> = Promise.resolve()
  private readonlyNewer = false
  private blockedWrite: SaveFailureReason | null = null
  private quarantineSequence = 0

  constructor(options: YamlFileStoreOptions<T>) {
    this.codec = options.codec
    this.defaults = options.defaults
    this.filePath = options.filePath
    this.backupPath = `${options.filePath}.bak`
    this.migrations = options.migrations ?? {}
    this.warnBytes = options.warnBytes ?? DEFAULT_WARN_BYTES
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
    this.clock = options.now ?? (() => new Date())
    this.renameImpl = options.renameFile ?? rename
  }

  /** True when the current files must not be overwritten. */
  isWriteBlocked(): boolean {
    return this.readonlyNewer || this.blockedWrite !== null
  }

  async load(): Promise<LoadedPersistence<T>> {
    // Loading shares the write queue: an in-flight save must finish before the
    // files are inspected, and a load must not interleave with a rename.
    return this.enqueue(() => this.loadNow())
  }

  private async loadNow(): Promise<LoadedPersistence<T>> {
    this.readonlyNewer = false
    this.blockedWrite = null
    const warnings: PersistenceWarning[] = []

    const primaryRead = await this.readOutcome(this.filePath)
    const primary = await this.accept(this.filePath, primaryRead, warnings)
    if (primary !== null) {
      if (primary.migrated) {
        await this.recordRewrite(primary.value, warnings)
      }
      return { status: 'loaded', value: primary.value, missing: false, warnings }
    }

    // A file written by a newer version is never overwritten or replaced by
    // the backup; the warning explains why defaults are in use.
    if (this.readonlyNewer) {
      return {
        status: 'defaults',
        value: structuredClone(this.defaults),
        missing: false,
        warnings
      }
    }

    const primaryPresent = primaryRead.status !== 'missing'
    if (shouldQuarantine(primaryRead)) {
      await this.quarantine(this.filePath, warnings)
    }

    const backupRead = await this.readOutcome(this.backupPath)
    const backup = await this.accept(this.backupPath, backupRead, warnings)
    if (backup !== null) {
      warnings.push({
        code: 'recovered-from-backup',
        paths: [this.backupPath, this.filePath]
      })
      if (backup.migrated) {
        await this.recordRewrite(backup.value, warnings)
      }
      return { status: 'loaded', value: backup.value, missing: false, warnings }
    }

    const backupPresent = backupRead.status !== 'missing'
    if (shouldQuarantine(backupRead)) {
      await this.quarantine(this.backupPath, warnings)
    }

    if (!this.readonlyNewer && (primaryPresent || backupPresent)) {
      warnings.push({
        code: 'defaults-used',
        paths: [this.filePath, this.backupPath]
      })
    }

    return {
      status: 'defaults',
      value: structuredClone(this.defaults),
      missing: !primaryPresent && !backupPresent,
      warnings
    }
  }

  async save(value: T): Promise<SaveResult> {
    return this.enqueue(() => this.persist(value))
  }

  private async accept(
    filePath: string,
    read: ReadOutcome<T>,
    warnings: PersistenceWarning[]
  ): Promise<Accepted<T> | null> {
    if (read.status === 'missing') {
      return null
    }
    if (read.status === 'unreadable') {
      this.blockedWrite = 'read-failed'
      warnings.push({ code: 'read-failed', paths: [filePath] })
      return null
    }
    if (read.status === 'too-large') {
      this.blockedWrite = 'file-too-large'
      warnings.push({ code: 'file-too-large', paths: [filePath] })
      return null
    }

    if (read.bytes > this.warnBytes) {
      warnings.push({ code: 'large-file', paths: [filePath] })
    }

    const outcome = read.outcome
    if (outcome.status === 'valid') {
      return { value: outcome.value, migrated: false }
    }
    if (outcome.status === 'future') {
      this.readonlyNewer = true
      warnings.push({ code: 'future-version', paths: [filePath], version: outcome.version })
      return null
    }
    if (outcome.status === 'older') {
      const migrate = this.migrations[outcome.version]
      if (migrate === undefined) {
        return null
      }
      let migratedRaw: unknown
      try {
        migratedRaw = migrate(outcome.raw)
      } catch {
        return null
      }
      const parsed = this.codec.schema.safeParse(migratedRaw)
      if (!parsed.success) {
        return null
      }
      warnings.push({ code: 'migrated', paths: [filePath], version: outcome.version })
      return { value: parsed.data, migrated: true }
    }
    return null
  }

  private async recordRewrite(value: T, warnings: PersistenceWarning[]): Promise<void> {
    const result = await this.persist(value)
    if (!result.ok) {
      warnings.push({ code: 'save-failed', paths: [this.filePath] })
    }
  }

  private async readOutcome(filePath: string): Promise<ReadOutcome<T>> {
    let info
    try {
      info = await stat(filePath)
    } catch (error) {
      const code = errorCode(error)
      return code === 'ENOENT' ? { status: 'missing' } : { status: 'unreadable', code }
    }
    if (info.size > this.maxBytes) {
      return { status: 'too-large', bytes: info.size }
    }

    let text: string
    try {
      text = await readFile(filePath, 'utf8')
    } catch (error) {
      return { status: 'unreadable', code: errorCode(error) }
    }

    const bytes = Buffer.byteLength(text, 'utf8')
    if (bytes > this.maxBytes) {
      return { status: 'too-large', bytes }
    }

    let raw: unknown
    try {
      // Defensive options: aliases are capped and duplicate keys are rejected.
      raw = parseYaml(text, { maxAliasCount: 100, uniqueKeys: true })
    } catch {
      return {
        status: 'parsed',
        outcome: { status: 'invalid', issues: ['yaml:invalid'] },
        bytes,
        text
      }
    }

    return { status: 'parsed', outcome: this.codec.parse(raw), bytes, text }
  }

  private async persist(value: T): Promise<SaveResult> {
    if (this.readonlyNewer) {
      return { ok: false, reason: 'readonly-newer' }
    }
    if (this.blockedWrite !== null) {
      return { ok: false, reason: this.blockedWrite }
    }

    const parsed = this.codec.schema.safeParse(value)
    if (!parsed.success) {
      return { ok: false, reason: 'invalid' }
    }

    const text = stringifyYaml(parsed.data, { lineWidth: 0 })
    const tmpPath = `${this.filePath}.tmp`
    const backupTmpPath = `${this.backupPath}.tmp`

    try {
      await mkdir(dirname(this.filePath), { recursive: true })
      await this.writeSynced(tmpPath, text)
    } catch {
      await safeUnlink(tmpPath)
      return { ok: false, reason: 'io-error' }
    }

    try {
      const current = await this.readOutcome(this.filePath)
      if (isFuture(current)) {
        this.readonlyNewer = true
        await safeUnlink(tmpPath)
        return { ok: false, reason: 'readonly-newer' }
      }
      if (current.status === 'unreadable') {
        await safeUnlink(tmpPath)
        return { ok: false, reason: 'read-failed' }
      }
      if (current.status === 'too-large') {
        await safeUnlink(tmpPath)
        return { ok: false, reason: 'file-too-large' }
      }
      if (
        current.status === 'parsed' &&
        (current.outcome.status === 'valid' || current.outcome.status === 'older')
      ) {
        // The previous recognized content becomes the backup in the same order
        // the plan requires: primary tmp is already fsynced at this point.
        // Older files are backed up here as well: a migration must not lose
        // the last version the app could read.
        await this.writeSynced(backupTmpPath, current.text)
        await this.renameWithRetry(backupTmpPath, this.backupPath)
      } else if (current.status === 'parsed' && current.outcome.status === 'invalid') {
        const warnings: PersistenceWarning[] = []
        await this.quarantine(this.filePath, warnings)
        if (warnings.some((warning) => warning.code === 'quarantine-failed')) {
          await safeUnlink(tmpPath)
          return { ok: false, reason: 'io-error' }
        }
      }

      await this.renameWithRetry(tmpPath, this.filePath)
      return { ok: true }
    } catch {
      await safeUnlink(tmpPath)
      await safeUnlink(backupTmpPath)
      return { ok: false, reason: 'io-error' }
    }
  }

  private async writeSynced(path: string, text: string): Promise<void> {
    const handle = await open(path, 'w')
    try {
      await handle.writeFile(text, 'utf8')
      await handle.sync()
    } finally {
      await handle.close()
    }
  }

  private async renameWithRetry(from: string, to: string): Promise<void> {
    for (const [index, delay] of RENAME_DELAYS_MS.entries()) {
      await sleep(delay)
      try {
        await this.renameImpl(from, to)
        return
      } catch (error) {
        const lastAttempt = index === RENAME_DELAYS_MS.length - 1
        if (!isRetriableRenameError(error) || lastAttempt) {
          throw error
        }
      }
    }
  }

  private async quarantine(filePath: string, warnings: PersistenceWarning[]): Promise<void> {
    const stamp = this.clock().toISOString().replace(/[:.]/g, '-')
    const sequence = this.quarantineSequence++
    const target = `${filePath}.corrupt-${stamp}-${sequence}`
    try {
      await rename(filePath, target)
      warnings.push({ code: 'quarantined', paths: [filePath, target] })
    } catch {
      warnings.push({ code: 'quarantine-failed', paths: [filePath] })
    }
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.tail.then(task, task)
    this.tail = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }
}
