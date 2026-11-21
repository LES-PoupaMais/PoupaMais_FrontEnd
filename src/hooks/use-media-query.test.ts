import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { simularLargura } from '@/test/media'
import { MIDIA, useMediaQuery } from './use-media-query'

describe('useMediaQuery', () => {
  it('acompanha a largura da janela', () => {
    const { result } = renderHook(() => useMediaQuery(MIDIA.computador))
    expect(result.current).toBe(false)

    act(() => simularLargura(1280))
    expect(result.current).toBe(true)

    act(() => simularLargura(834))
    expect(result.current).toBe(false)
  })
})
