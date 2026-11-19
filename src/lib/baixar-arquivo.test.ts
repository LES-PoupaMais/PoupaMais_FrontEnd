import { describe, expect, it, vi } from 'vitest'
import { salvarArquivo } from './baixar-arquivo'

describe('salvarArquivo', () => {
  it('clica num link temporário com o nome do arquivo e revoga a URL depois', () => {
    vi.useFakeTimers()
    const criar = vi.fn(() => 'blob:x')
    const revogar = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar }))
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    salvarArquivo(new Blob(['a']), 'lancamentos.csv')
    expect(clique).toHaveBeenCalled()
    expect((clique.mock.contexts[0] as HTMLAnchorElement).download).toBe('lancamentos.csv')
    expect(document.querySelector('a[download]')).toBeNull()
    vi.advanceTimersByTime(1000)
    expect(revogar).toHaveBeenCalledWith('blob:x')
    vi.useRealTimers()
  })
})
