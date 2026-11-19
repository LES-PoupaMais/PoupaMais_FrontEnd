import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useOnline } from './use-online'

describe('useOnline', () => {
  afterEach(() => vi.restoreAllMocks())

  it('acompanha os eventos online/offline do navegador', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(true)

    onLine.mockReturnValue(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })
})
