import type { ConnectionFailureReason } from '../../../../application/persistence/connections-service'
import {
  isConnectionColor,
  type ConnectionColor
} from '../../../../domain/persistence/connection-palette'
import type { ConnectionEnvironment } from '../../../../domain/persistence/types'
import type { ConnectionValidationCode } from './validation'

const ENVIRONMENT_KEYS: Record<ConnectionEnvironment, string> = {
  development: 'connections.environment.development',
  staging: 'connections.environment.staging',
  production: 'connections.environment.production',
  custom: 'connections.environment.custom'
}

const COLOR_KEYS: Record<ConnectionColor, string> = {
  '#2563eb': 'connections.color.blue',
  '#16a34a': 'connections.color.green',
  '#d97706': 'connections.color.amber',
  '#dc2626': 'connections.color.red',
  '#7c3aed': 'connections.color.violet',
  '#0d9488': 'connections.color.teal',
  '#db2777': 'connections.color.pink',
  '#4b5563': 'connections.color.gray'
}

const FAILURE_KEYS: Record<ConnectionFailureReason, string> = {
  'duplicate-name': 'connections.errors.duplicateName',
  'not-found': 'connections.errors.notFound',
  invalid: 'connections.errors.invalid',
  'readonly-newer': 'connections.errors.readonlyNewer',
  'read-failed': 'connections.errors.readFailed',
  'file-too-large': 'connections.errors.fileTooLarge',
  'io-error': 'connections.errors.ioError',
  'encryption-unavailable': 'connections.errors.encryptionUnavailable',
  'decryption-failed': 'connections.errors.decryptionFailed',
  internal: 'connections.errors.internal'
}

const VALIDATION_KEYS: Record<ConnectionValidationCode, string> = {
  required: 'connections.errors.required',
  'name-too-long': 'connections.errors.nameTooLong',
  'host-too-long': 'connections.errors.hostTooLong',
  'user-too-long': 'connections.errors.userTooLong',
  'port-range': 'connections.errors.portRange',
  'environment-label-required': 'connections.errors.environmentLabelRequired',
  'environment-label-too-long': 'connections.errors.environmentLabelTooLong',
  'color-required': 'connections.errors.colorRequired'
}

export function environmentMessageKey(environment: ConnectionEnvironment): string {
  return ENVIRONMENT_KEYS[environment]
}

export function connectionColorKey(color: string): string {
  return isConnectionColor(color) ? COLOR_KEYS[color] : COLOR_KEYS['#4b5563']
}

export function connectionFailureMessageKey(reason: ConnectionFailureReason): string {
  return FAILURE_KEYS[reason]
}

export function validationMessageKey(code: ConnectionValidationCode): string {
  return VALIDATION_KEYS[code]
}

/** Case-insensitive by name; creation order remains the one stored in YAML. */
export function sortConnections<T extends { readonly id: string; readonly name: string }>(
  profiles: readonly T[]
): T[] {
  return [...profiles].sort((left, right) => {
    const byName = left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
    if (byName !== 0) {
      return byName
    }
    const exact = left.name.localeCompare(right.name)
    return exact !== 0 ? exact : left.id.localeCompare(right.id)
  })
}
