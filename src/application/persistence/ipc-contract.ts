import { z } from 'zod'

import { localeSchema, themeSchema } from '../../domain/persistence/schemas'
import { IPC_CHANNELS } from './channels'

export { IPC_CHANNELS }

/**
 * Input shapes shared by main and preload. The main process remains the
 * validation boundary; these schemas exist so both sides agree.
 */

export const preferencesInputSchema = z.strictObject({
  theme: themeSchema,
  locale: localeSchema
})

export const connectionInputSchema = z.strictObject({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(100),
  color: z.string().max(20),
  environment: z.string().max(32),
  host: z.string().min(1).max(253),
  port: z.int().min(1).max(65535),
  user: z.string().max(128),
  password: z.string().max(4096).nullable().optional()
})

export const connectionIdSchema = z.strictObject({
  id: z.string().min(1).max(128)
})

export const closeReplySchema = z.strictObject({
  ok: z.boolean(),
  discard: z.boolean().optional()
})

export type PreferencesInput = z.infer<typeof preferencesInputSchema>

export type ConnectionInput = z.infer<typeof connectionInputSchema>
