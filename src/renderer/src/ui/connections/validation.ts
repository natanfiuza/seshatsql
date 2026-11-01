import { isConnectionColor } from '../../../../domain/persistence/connection-palette'
import {
  CONNECTION_ENVIRONMENTS,
  type ConnectionEnvironment
} from '../../../../domain/persistence/types'

export type ConnectionField =
  | 'name'
  | 'host'
  | 'port'
  | 'user'
  | 'environment'
  | 'environmentLabel'
  | 'color'

export type ConnectionValidationCode =
  | 'required'
  | 'name-too-long'
  | 'host-too-long'
  | 'user-too-long'
  | 'port-range'
  | 'environment-label-required'
  | 'environment-label-too-long'
  | 'color-required'

export interface ConnectionValidationIssue {
  readonly field: ConnectionField
  readonly code: ConnectionValidationCode
}

export interface ConnectionFormValues {
  readonly name: string
  readonly host: string
  readonly port: string
  readonly user: string
  readonly environment: ConnectionEnvironment
  readonly environmentLabel: string
  readonly color: string
}

function isEnvironment(value: string): value is ConnectionEnvironment {
  return (CONNECTION_ENVIRONMENTS as readonly string[]).includes(value)
}

/** Ordered from top to bottom so submit can focus the first invalid field. */
export function validateConnectionForm(values: ConnectionFormValues): ConnectionValidationIssue[] {
  const issues: ConnectionValidationIssue[] = []

  const name = values.name.trim()
  if (name.length === 0) {
    issues.push({ field: 'name', code: 'required' })
  } else if (name.length > 100) {
    issues.push({ field: 'name', code: 'name-too-long' })
  }

  const host = values.host.trim()
  if (host.length === 0) {
    issues.push({ field: 'host', code: 'required' })
  } else if (host.length > 253) {
    issues.push({ field: 'host', code: 'host-too-long' })
  }

  const port = values.port.trim()
  if (port.length === 0) {
    issues.push({ field: 'port', code: 'required' })
  } else if (!/^\d+$/.test(port)) {
    issues.push({ field: 'port', code: 'port-range' })
  } else {
    const parsed = Number(port)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      issues.push({ field: 'port', code: 'port-range' })
    }
  }

  const user = values.user.trim()
  if (user.length === 0) {
    issues.push({ field: 'user', code: 'required' })
  } else if (user.length > 128) {
    issues.push({ field: 'user', code: 'user-too-long' })
  }

  if (!isEnvironment(values.environment)) {
    issues.push({ field: 'environment', code: 'required' })
  }

  if (values.environment === 'custom') {
    const label = values.environmentLabel.trim()
    if (label.length === 0) {
      issues.push({ field: 'environmentLabel', code: 'environment-label-required' })
    } else if (label.length > 32) {
      issues.push({ field: 'environmentLabel', code: 'environment-label-too-long' })
    }
  }

  if (!isConnectionColor(values.color)) {
    issues.push({ field: 'color', code: 'color-required' })
  }

  return issues
}
