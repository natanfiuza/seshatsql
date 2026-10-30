import { describe, expect, it } from 'vitest'

import { PRODUCT_NAME } from '../../src/domain/app-info'

describe('PRODUCT_NAME', () => {
  it('keeps the name defined by the baseline', () => {
    expect(PRODUCT_NAME).toBe('SeshatSQL')
  })
})
