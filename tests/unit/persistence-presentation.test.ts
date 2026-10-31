import { describe, expect, it } from 'vitest'

import type { PersistenceWarningCode } from '../../src/domain/persistence/types'
import {
  toWarningViews,
  warningMessageKey
} from '../../src/renderer/src/persistence/presentation'

const EXPECTED_KEYS: Record<PersistenceWarningCode, string> = {
  'recovered-from-backup': 'persistence.warning.recovered',
  quarantined: 'persistence.warning.quarantined',
  'quarantine-failed': 'persistence.warning.quarantineFailed',
  'future-version': 'persistence.warning.futureVersion',
  migrated: 'persistence.warning.migrated',
  'large-file': 'persistence.warning.largeFile',
  'file-too-large': 'persistence.warning.fileTooLarge',
  'read-failed': 'persistence.warning.readFailed',
  'defaults-used': 'persistence.warning.defaultsUsed',
  'legacy-directory': 'persistence.warning.legacyDirectory',
  'save-failed': 'persistence.warning.saveFailed'
}

describe('persistence presentation', () => {
  it('maps every warning code to a catalog key', () => {
    for (const [code, key] of Object.entries(EXPECTED_KEYS)) {
      expect(warningMessageKey(code as PersistenceWarningCode)).toBe(key)
    }
  })

  it('keeps paths and versions and collapses duplicate warnings', () => {
    const views = toWarningViews([
      { code: 'quarantined', paths: ['a.yml', 'b.yml'] },
      { code: 'quarantined', paths: ['a.yml', 'b.yml'] },
      { code: 'future-version', paths: ['c.yml'], version: 3 }
    ])

    expect(views).toEqual([
      {
        id: 'quarantined|a.yml|b.yml|',
        messageKey: 'persistence.warning.quarantined',
        paths: ['a.yml', 'b.yml'],
        version: null
      },
      {
        id: 'future-version|c.yml|3',
        messageKey: 'persistence.warning.futureVersion',
        paths: ['c.yml'],
        version: 3
      }
    ])
  })
})
