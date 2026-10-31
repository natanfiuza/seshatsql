import type { PersistedConnection, PublicConnection } from './types'

/**
 * Copies only the fields the renderer may see. Ciphertext is not "safe enough"
 * to expose: the preload contract never carries it either.
 */
export function toPublicConnection(profile: PersistedConnection): PublicConnection {
  return {
    id: profile.id,
    name: profile.name,
    color: profile.color,
    environment: profile.environment,
    host: profile.host,
    port: profile.port,
    user: profile.user,
    hasPassword: profile.password !== null
  }
}
