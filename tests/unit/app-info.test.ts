import { describe, expect, it } from 'vitest'

import { PRODUCT_NAME } from '../../src/domain/app-info'

describe('PRODUCT_NAME', () => {
  it('mantém o nome definido pela baseline', () => {
    expect(PRODUCT_NAME).toBe('SeshatSQL')
  })
})
