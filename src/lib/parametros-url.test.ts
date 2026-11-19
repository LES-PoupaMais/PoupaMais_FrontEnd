import { describe, expect, it } from 'vitest'
import { lerVer } from './parametros-url'

describe('lerVer', () => {
  it('aceita só id inteiro positivo', () => {
    expect(lerVer(new URLSearchParams('ver=7'))).toBe(7)
    for (const ver of ['-1', '0', '1.5', 'abc', '', '1e3', ' 7', '99999999999999999999'])
      expect(lerVer(new URLSearchParams({ ver }))).toBeUndefined()
    expect(lerVer(new URLSearchParams())).toBeUndefined()
  })
})
