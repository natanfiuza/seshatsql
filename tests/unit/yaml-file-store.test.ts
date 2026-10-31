import { mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import { preferencesCodec } from '../../src/domain/persistence/schemas'
import {
  DEFAULT_PREFERENCES,
  type PreferencesV1
} from '../../src/domain/persistence/types'
import {
  YamlFileStore,
  type YamlFileStoreOptions
} from '../../src/infrastructure/persistence/yaml-file-store'

const LIGHT: PreferencesV1 = { schemaVersion: 1, theme: 'light', locale: 'en-US' }
const DARK: PreferencesV1 = { schemaVersion: 1, theme: 'dark', locale: 'fr' }

let directory: string
let filePath: string

function createStore(
  options: Partial<YamlFileStoreOptions<PreferencesV1>> = {}
): YamlFileStore<PreferencesV1> {
  return new YamlFileStore<PreferencesV1>({
    filePath,
    codec: preferencesCodec,
    defaults: DEFAULT_PREFERENCES,
    ...options
  })
}

async function readYaml(path: string): Promise<unknown> {
  return parseYaml(await readFile(path, 'utf8'))
}

async function names(): Promise<string[]> {
  return (await readdir(directory)).sort()
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'seshat-store-'))
  filePath = join(directory, 'preferences.yml')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('YamlFileStore', () => {
  it('returns defaults when no file exists', async () => {
    const loaded = await createStore().load()

    expect(loaded).toEqual({
      status: 'defaults',
      value: DEFAULT_PREFERENCES,
      missing: true,
      warnings: []
    })
  })

  it('writes atomically and keeps the previous valid file as .bak', async () => {
    const store = createStore()
    expect(await store.save(LIGHT)).toEqual({ ok: true })
    expect(await readYaml(filePath)).toEqual(LIGHT)
    expect(await names()).toEqual(['preferences.yml'])

    expect(await store.save(DARK)).toEqual({ ok: true })
    expect(await readYaml(filePath)).toEqual(DARK)
    expect(await readYaml(`${filePath}.bak`)).toEqual(LIGHT)
    expect(await names()).toEqual(['preferences.yml', 'preferences.yml.bak'])
  })

  it('recovers a corrupted primary from the backup and quarantines the primary', async () => {
    const store = createStore()
    await store.save(LIGHT)
    await store.save(DARK)
    await writeFile(filePath, ': not: [valid yaml', 'utf8')

    const loaded = await store.load()

    expect(loaded.status).toBe('loaded')
    expect(loaded.value).toEqual(LIGHT)
    expect(loaded.warnings).toContainEqual({
      code: 'recovered-from-backup',
      paths: [`${filePath}.bak`, filePath]
    })
    expect(loaded.warnings.map((warning) => warning.code)).toContain('quarantined')

    const files = await names()
    expect(files.some((name) => name.startsWith('preferences.yml.corrupt-'))).toBe(true)
    expect(files).not.toContain('preferences.yml')
  })

  it('quarantines both invalid files and falls back to defaults without deleting them', async () => {
    await writeFile(filePath, 'schemaVersion: 1\ntheme: nope\nlocale: fr\n', 'utf8')
    await writeFile(`${filePath}.bak`, 'just a string\n', 'utf8')

    const loaded = await createStore().load()

    expect(loaded.status).toBe('defaults')
    expect(loaded.missing).toBe(false)
    expect(loaded.value).toEqual(DEFAULT_PREFERENCES)
    const codes = loaded.warnings.map((warning) => warning.code)
    expect(codes.filter((code) => code === 'quarantined')).toHaveLength(2)
    expect(codes).toContain('defaults-used')

    const quarantined = (await names()).filter((name) => name.includes('.corrupt-'))
    expect(quarantined).toHaveLength(2)
  })

  it('refuses to overwrite a file written by a newer version', async () => {
    const future = stringifyYaml({ schemaVersion: 2, theme: 'dark', locale: 'fr' })
    await writeFile(filePath, future, 'utf8')

    const store = createStore()
    const loaded = await store.load()

    expect(loaded.status).toBe('defaults')
    expect(loaded.warnings).toContainEqual({
      code: 'future-version',
      paths: [filePath],
      version: 2
    })
    expect(store.isWriteBlocked()).toBe(true)
    expect(await store.save(LIGHT)).toEqual({ ok: false, reason: 'readonly-newer' })
    expect(await readFile(filePath, 'utf8')).toBe(future)
  })

  it('migrates an older file in memory and rewrites it after the backup', async () => {
    const old = stringifyYaml({ schemaVersion: 0, theme: 'dark', locale: 'fr' })
    await writeFile(filePath, old, 'utf8')

    const store = createStore({
      migrations: {
        0: (raw) => ({ ...(raw as Record<string, unknown>), schemaVersion: 1 })
      }
    })
    const loaded = await store.load()

    expect(loaded.status).toBe('loaded')
    expect(loaded.value).toEqual(DARK)
    expect(loaded.warnings).toContainEqual({ code: 'migrated', paths: [filePath], version: 0 })
    expect(await readYaml(filePath)).toEqual(DARK)
    expect(await readYaml(`${filePath}.bak`)).toMatchObject({ schemaVersion: 0 })
  })

  it('quarantines an older file when no migration exists', async () => {
    await writeFile(filePath, stringifyYaml({ schemaVersion: 0, theme: 'dark', locale: 'fr' }), 'utf8')

    const loaded = await createStore().load()

    expect(loaded.status).toBe('defaults')
    expect(loaded.warnings.map((warning) => warning.code)).toContain('quarantined')
    expect((await names()).some((name) => name.startsWith('preferences.yml.corrupt-'))).toBe(true)
  })

  it('warns about a large file without truncating it', async () => {
    const store = createStore({ warnBytes: 16 })
    await store.save(DARK)

    const loaded = await store.load()

    expect(loaded.status).toBe('loaded')
    expect(loaded.value).toEqual(DARK)
    expect(loaded.warnings).toContainEqual({ code: 'large-file', paths: [filePath] })
  })

  it('blocks reading and writing a file above the safety limit', async () => {
    const store = createStore({ maxBytes: 16 })
    await store.save(DARK)

    const loaded = await store.load()

    expect(loaded.status).toBe('defaults')
    expect(loaded.warnings).toContainEqual({ code: 'file-too-large', paths: [filePath] })
    expect(store.isWriteBlocked()).toBe(true)
    expect(await store.save(LIGHT)).toEqual({ ok: false, reason: 'file-too-large' })
  })

  it('retries a transient rename failure and still saves', async () => {
    let attempts = 0
    const store = createStore({
      renameFile: async (from, to) => {
        attempts += 1
        if (attempts <= 2) {
          const error = new Error('busy') as NodeJS.ErrnoException
          error.code = 'EBUSY'
          throw error
        }
        await rename(from, to)
      }
    })

    expect(await store.save(LIGHT)).toEqual({ ok: true })
    expect(attempts).toBe(3)
    expect(await readYaml(filePath)).toEqual(LIGHT)
  })

  it('aborts the save when the rename keeps failing and never writes the primary directly', async () => {
    const store = createStore()
    await store.save(LIGHT)

    const failing = createStore({
      renameFile: async () => {
        const error = new Error('locked') as NodeJS.ErrnoException
        error.code = 'EPERM'
        throw error
      }
    })

    expect(await failing.save(DARK)).toEqual({ ok: false, reason: 'io-error' })
    expect(await readYaml(filePath)).toEqual(LIGHT)
    expect(await names()).toEqual(['preferences.yml'])
  })

  it('serializes concurrent saves so the last queued value wins', async () => {
    const store = createStore()
    const [first, second] = await Promise.all([store.save(LIGHT), store.save(DARK)])

    expect(first).toEqual({ ok: true })
    expect(second).toEqual({ ok: true })
    expect(await readYaml(filePath)).toEqual(DARK)
    expect(await readYaml(`${filePath}.bak`)).toEqual(LIGHT)
  })

  it('rejects a value that does not match the schema', async () => {
    const store = createStore()
    const invalid = { schemaVersion: 1, theme: 'blue', locale: 'fr' } as unknown as PreferencesV1

    expect(await store.save(invalid)).toEqual({ ok: false, reason: 'invalid' })
    expect(await names()).toEqual([])
  })
})
