import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useConexao } from './use-conexao'

describe('useConexao', () => {
  afterEach(() => vi.restoreAllMocks())

  it('acompanha os eventos online/offline', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useConexao())
    expect(result.current).toBe(true)
    online.mockReturnValue(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })
})
