import { act, renderHook } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server-e-dados'
import { criarWrapper } from '@/test/utils'
import { useBaixarModeloCsv, useExportarLancamentos } from './use-exportacao'

vi.mock('@/lib/baixar-arquivo', () => ({ salvarArquivo: vi.fn() }))
const { salvarArquivo } = await import('@/lib/baixar-arquivo')

describe('useExportarLancamentos e useBaixarModeloCsv', () => {
  it('exporta com os filtros e o nome do Content-Disposition', async () => {
    let busca = ''
    server.use(
      msw.get('*/api/lancamentos/exportar', ({ request }) => {
        busca = new URL(request.url).search
        return new HttpResponse('a;b', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="lancamentos-11-2026.csv"',
          },
        })
      }),
    )
    const { wrapper } = criarWrapper()
    const { result } = renderHook(() => useExportarLancamentos(), { wrapper })
    const nome = await act(() =>
      result.current.mutateAsync({ formato: 'csv', filtros: { mes: 11, ano: 2026, tipo: 'DESPESA' } }),
    )
    expect(nome).toBe('lancamentos-11-2026.csv')
    expect(busca).toContain('formato=csv')
    expect(busca).toContain('tipo=DESPESA')
    expect(salvarArquivo).toHaveBeenCalledWith(expect.any(Blob), 'lancamentos-11-2026.csv')
  })

  it('sem Content-Disposition usa um nome padrão', async () => {
    server.use(
      msw.get('*/api/lancamentos/exportar', () => new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } })),
      msw.get(
        '*/api/lancamentos/template-csv',
        () => new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } }),
      ),
    )
    const { wrapper } = criarWrapper()
    const exportar = renderHook(() => useExportarLancamentos(), { wrapper }).result
    expect(await act(() => exportar.current.mutateAsync({ formato: 'xlsx', filtros: {} }))).toBe('lancamentos.xlsx')
    const modelo = renderHook(() => useBaixarModeloCsv(), { wrapper }).result
    expect(await act(() => modelo.current.mutateAsync())).toBe('modelo-lancamentos.csv')
  })
})
