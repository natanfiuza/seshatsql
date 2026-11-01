import { z } from 'zod'

import { DEFAULT_CONNECTION_COLOR } from './connection-palette'
import {
  CONNECTIONS_SCHEMA_VERSION,
  type ConnectionsV1,
  type ConnectionsV2,
  type ConnectionEnvironment,
  type PersistedConnection,
  type PersistedConnectionV1
} from './types'

/**
 * Shape written by S06. It is intentionally tolerant: color and environment
 * were free text, and user could be empty. A malformed document throws so the
 * YAML store quarantines it instead of discarding data silently.
 */
const legacySecretSchema = z.strictObject({
  scheme: z.literal('dpapi'),
  data: z
    .string()
    .min(1)
    .max(64 * 1024)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/)
})

const legacyConnectionSchema: z.ZodType<PersistedConnectionV1> = z.strictObject({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(100),
  color: z.string().max(20),
  environment: z.string().max(32),
  host: z.string().min(1).max(253),
  port: z.int().min(1).max(65535),
  user: z.string().max(128),
  password: legacySecretSchema.nullable()
})

export const connectionsV1Schema: z.ZodType<ConnectionsV1> = z
  .strictObject({
    schemaVersion: z.literal(1),
    profiles: z.array(legacyConnectionSchema).max(500)
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
  })

const DEVELOPMENT_ENVIRONMENTS = new Set(['dev', 'development', 'desenvolvimento'])
const STAGING_ENVIRONMENTS = new Set(['test', 'staging', 'homologacao'])
const PRODUCTION_ENVIRONMENTS = new Set(['prod', 'production', 'producao'])

function normalizeEnvironment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function mapEnvironment(environment: string): ConnectionEnvironment {
  const normalized = normalizeEnvironment(environment)
  if (DEVELOPMENT_ENVIRONMENTS.has(normalized)) {
    return 'development'
  }
  if (STAGING_ENVIRONMENTS.has(normalized)) {
    return 'staging'
  }
  if (PRODUCTION_ENVIRONMENTS.has(normalized)) {
    return 'production'
  }
  return 'custom'
}

function mapColor(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : DEFAULT_CONNECTION_COLOR
}

function migrateProfile(profile: PersistedConnectionV1): PersistedConnection {
  const environment = mapEnvironment(profile.environment)
  const customLabel = profile.environment.trim()
  return {
    id: profile.id,
    name: profile.name,
    color: mapColor(profile.color),
    environment,
    environmentLabel: environment === 'custom' && customLabel.length > 0 ? customLabel : null,
    host: profile.host,
    port: profile.port,
    user: profile.user,
    password: profile.password
  }
}

/**
 * In-memory v1 -> v2 migration. The store validates the result against the
 * current schema and preserves the original file in .bak before rewriting.
 * Unknown environment values become a custom environment whose label keeps
 * the original text, so no user input is lost.
 */
export function migrateConnectionsV1ToV2(raw: unknown): ConnectionsV2 {
  const parsed = connectionsV1Schema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('invalid v1 connections document')
  }
  return {
    schemaVersion: CONNECTIONS_SCHEMA_VERSION,
    profiles: parsed.data.profiles.map(migrateProfile)
  }
}
