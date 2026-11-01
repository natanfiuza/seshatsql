import { z } from 'zod'

import { CONNECTION_COLORS } from '../../domain/persistence/connection-palette'
import {
  connectionEnvironmentSchema,
  localeSchema,
  themeSchema
} from '../../domain/persistence/schemas'
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

export const connectionInputSchema = z
  .strictObject({
    id: z.string().min(1).max(128).optional(),
    name: z.string().trim().min(1).max(100),
    color: z.enum(CONNECTION_COLORS),
    environment: connectionEnvironmentSchema,
    environmentLabel: z.string().trim().min(1).max(32).nullable().optional(),
    host: z.string().trim().min(1).max(253),
    port: z.int().min(1).max(65535),
    user: z.string().trim().min(1).max(128),
    password: z.string().max(4096).nullable().optional()
  })
  .superRefine((input, context) => {
    if (input.environment === 'custom' && input.environmentLabel == null) {
      context.addIssue({
        code: 'custom',
        message: 'environmentLabel is required for custom',
        path: ['environmentLabel']
      })
    }
    if (input.environment !== 'custom' && input.environmentLabel != null) {
      context.addIssue({
        code: 'custom',
        message: 'environmentLabel is only valid for custom',
        path: ['environmentLabel']
      })
    }
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
