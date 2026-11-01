import { z } from 'zod'

import {
  CONNECTION_ENVIRONMENTS,
  CONNECTIONS_SCHEMA_VERSION,
  PERSISTED_LOCALES,
  PERSISTED_THEMES,
  PERSISTENCE_SCHEMA_VERSION,
  type ConnectionsV2,
  type ParseOutcome,
  type PersistedConnection,
  type PersistedCursor,
  type PersistedSelection,
  type PersistedTab,
  type PreferencesV1,
  type TabsStateV1
} from './types'

const ID = z.string().min(1).max(128)
const SHORT_TEXT = z.string().max(256)

export const themeSchema = z.enum(PERSISTED_THEMES)
export const localeSchema = z.enum(PERSISTED_LOCALES)
export const connectionEnvironmentSchema = z.enum(CONNECTION_ENVIRONMENTS)
export const connectionColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .transform((value) => value.toLowerCase())

const cursorSchema: z.ZodType<PersistedCursor> = z.strictObject({
  lineNumber: z.int().min(1),
  column: z.int().min(1)
})

function isOrderedSelection(selection: PersistedSelection): boolean {
  if (selection.startLineNumber !== selection.endLineNumber) {
    return selection.startLineNumber < selection.endLineNumber
  }
  return selection.startColumn <= selection.endColumn
}

const selectionSchema: z.ZodType<PersistedSelection> = z
  .strictObject({
    startLineNumber: z.int().min(1),
    startColumn: z.int().min(1),
    endLineNumber: z.int().min(1),
    endColumn: z.int().min(1)
  })
  .refine(isOrderedSelection, { message: 'selection must be ordered' })

const tabSchema: z.ZodType<PersistedTab> = z.strictObject({
  id: ID,
  title: SHORT_TEXT.refine((value) => value.length > 0, { message: 'title is required' }),
  // SQL text is data. It is deliberately not truncated at read time; the
  // store warns (and blocks) only on the separate hard file-size limit.
  text: z.string(),
  connectionId: ID.nullable(),
  database: ID.nullable(),
  order: z.int().min(0),
  cursor: cursorSchema.nullable(),
  selection: selectionSchema.nullable()
})

export const tabsStateSchema = z
  .strictObject({
    schemaVersion: z.literal(PERSISTENCE_SCHEMA_VERSION),
    activeTabId: ID.nullable(),
    tabs: z.array(tabSchema).max(200)
  })
  .superRefine((state, context) => {
    const ids = new Set<string>()
    for (const [index, tab] of state.tabs.entries()) {
      if (ids.has(tab.id)) {
        context.addIssue({ code: 'custom', message: `duplicate tab id at ${index}`, path: ['tabs', index, 'id'] })
      }
      ids.add(tab.id)
    }
    if (state.activeTabId !== null && !ids.has(state.activeTabId)) {
      context.addIssue({
        code: 'custom',
        message: 'activeTabId must reference a tab',
        path: ['activeTabId']
      })
    }
  }) satisfies z.ZodType<TabsStateV1>

const base64Schema = z
  .string()
  .min(1)
  .max(64 * 1024)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, { message: 'password must be base64 ciphertext' })

/**
 * Only OS-encrypted secrets are representable. A plain string or a different
 * scheme is rejected by the shape itself, so plaintext can never be written.
 */
const secretSchema = z.strictObject({
  scheme: z.literal('dpapi'),
  data: base64Schema
})

/**
 * Persisted v2 profile. `custom` with a null label and an empty user are
 * tolerated so legacy files can load; the IPC boundary and the form require
 * the missing values before writing a new revision.
 */
const connectionSchema: z.ZodType<PersistedConnection> = z
  .strictObject({
    id: ID,
    name: z.string().min(1).max(100),
    color: connectionColorSchema,
    environment: connectionEnvironmentSchema,
    environmentLabel: z.string().min(1).max(32).nullable(),
    host: z.string().min(1).max(253),
    port: z.int().min(1).max(65535),
    user: z.string().max(128),
    password: secretSchema.nullable()
  })
  .superRefine((profile, context) => {
    if (profile.environment !== 'custom' && profile.environmentLabel !== null) {
      context.addIssue({
        code: 'custom',
        message: 'environmentLabel is only valid for custom',
        path: ['environmentLabel']
      })
    }
  })

const connectionsSchema = z
  .strictObject({
    schemaVersion: z.literal(CONNECTIONS_SCHEMA_VERSION),
    profiles: z.array(connectionSchema).max(500)
  })
  .superRefine((state, context) => {
    const ids = new Set<string>()
    for (const [index, profile] of state.profiles.entries()) {
      if (ids.has(profile.id)) {
        context.addIssue({
          code: 'custom',
          message: `duplicate connection id at ${index}`,
          path: ['profiles', index, 'id']
        })
      }
      ids.add(profile.id)
    }
  }) satisfies z.ZodType<ConnectionsV2>

const preferencesSchema: z.ZodType<PreferencesV1> = z.strictObject({
  schemaVersion: z.literal(PERSISTENCE_SCHEMA_VERSION),
  theme: themeSchema,
  locale: localeSchema
})

/** Payload accepted by preferences.set; the version is added by the main process. */
export const preferencesInputSchema = z.strictObject({
  theme: themeSchema,
  locale: localeSchema
})

export type PreferencesInput = z.infer<typeof preferencesInputSchema>

/**
 * Issues are reduced to paths and codes. Zod's default message for enums can
 * echo the received value, and a mis-shaped connection file may contain a
 * plaintext password in that position; neither may reach a log or the renderer.
 */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length === 0 ? '(root)' : issue.path.join('.')
    return `${path}:${issue.code}`
  })
}

function parseVersioned<T>(raw: unknown, schema: z.ZodType<T>, currentVersion: number): ParseOutcome<T> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { status: 'invalid', issues: ['(root):invalid_type'] }
  }

  const version = (raw as Record<string, unknown>)['schemaVersion']
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return { status: 'invalid', issues: ['schemaVersion:invalid_type'] }
  }
  if (version > currentVersion) {
    return { status: 'future', version, raw }
  }
  if (version < currentVersion) {
    return { status: 'older', version, raw }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return { status: 'invalid', issues: formatIssues(result.error) }
  }
  return { status: 'valid', value: result.data }
}

export const preferencesCodec = {
  schema: preferencesSchema,
  parse: (raw: unknown): ParseOutcome<PreferencesV1> =>
    parseVersioned(raw, preferencesSchema, PERSISTENCE_SCHEMA_VERSION)
}

export const tabsStateCodec = {
  schema: tabsStateSchema as z.ZodType<TabsStateV1>,
  parse: (raw: unknown): ParseOutcome<TabsStateV1> =>
    parseVersioned(raw, tabsStateSchema, PERSISTENCE_SCHEMA_VERSION)
}

export const connectionsCodec = {
  schema: connectionsSchema as z.ZodType<ConnectionsV2>,
  parse: (raw: unknown): ParseOutcome<ConnectionsV2> =>
    parseVersioned(raw, connectionsSchema, CONNECTIONS_SCHEMA_VERSION)
}

export interface VersionedCodec<T> {
  readonly schema: z.ZodType<T>
  readonly parse: (raw: unknown) => ParseOutcome<T>
}
