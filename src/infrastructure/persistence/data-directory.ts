import { join } from 'node:path'

/** Approved location: <home>/.seshatsql/data (see the S06 plan). */
export function resolveDataDirectory(home: string): string {
  return join(home, '.seshatsql', 'data')
}

/** Legacy location is only inspected, never migrated or deleted. */
export function resolveLegacyDataDirectory(home: string): string {
  return join(home, '.sqlseshat', 'data')
}

export interface PersistencePaths {
  readonly preferences: string
  readonly tabs: string
  readonly connections: string
}

export function resolvePersistencePaths(dataDirectory: string): PersistencePaths {
  return {
    preferences: join(dataDirectory, 'preferences.yml'),
    tabs: join(dataDirectory, 'tabs_states.yml'),
    connections: join(dataDirectory, 'connections.yml')
  }
}
