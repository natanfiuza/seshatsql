import type { LoadedPersistence, SaveResult } from '../../domain/persistence/types'

/** Application-facing store contract; the YAML implementation lives in infrastructure. */
export interface PersistenceStore<T> {
  load: () => Promise<LoadedPersistence<T>>
  save: (value: T) => Promise<SaveResult>
  isWriteBlocked: () => boolean
}
