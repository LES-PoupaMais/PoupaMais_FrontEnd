import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ESPERA_BUSCA_MS, useValorComEspera } from './use-valor-com-espera'

describe('useValorComEspera', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('a espera da busca é de 500 ms', () => {
    expect(ESPERA_BUSCA_MS).toBe(500)
  })

  it('começa com o valor inicial e só muda 500 ms depois da última mudança', () => {
    const { result, rerender } = renderHook(({ valor }) => useValorComEspera(valor), { initialProps: { valor: '' } })
    expect(result.current).toBe('')

    rerender({ valor: 'm' })
    act(() => vi.advanceTimersByTime(300))
    rerender({ valor: 'me' })
    act(() => vi.advanceTimersByTime(300))
    rerender({ valor: 'mer' })
    act(() => vi.advanceTimersByTime(499))
    expect(result.current).toBe('')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('mer')
  })

  it('aceita outra espera', () => {
    const { result, rerender } = renderHook(({ valor }) => useValorComEspera(valor, 100), {
      initialProps: { valor: 1 },
    })
    rerender({ valor: 2 })
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe(2)
  })
})
