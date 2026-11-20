import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/constants/query-keys'
import { INVALIDACOES, invalidarApos, type Mutacao } from './invalidacoes'

const FINANCEIROS = [queryKeys.lancamentos.todos, queryKeys.dashboard.todos, queryKeys.categorias.todas]
const familias = (chaves: readonly (readonly unknown[])[]) => chaves.map((chave) => chave[0]).sort()

describe('invalidacoes', () => {
  it.each<Mutacao>(['lancamentoSalvo', 'saldoAlterado', 'lancamentoNaLixeira', 'lancamentoRestaurado', 'importacao'])(
    '%s recarrega lançamentos (e a lixeira), dashboard e categorias',
    (mutacao) => {
      expect(familias(INVALIDACOES[mutacao])).toEqual(familias(FINANCEIROS))
    },
  )

  it('categoria alterada recarrega categorias, lançamentos e dashboard; perfil só o usuário', () => {
    expect(familias(INVALIDACOES.categoriaAlterada)).toEqual(['categorias', 'dashboard', 'lancamentos'])
    expect(INVALIDACOES.perfil).toEqual([queryKeys.usuario.eu])
  })

  it('invalidarApos invalida cada chave do mapa', async () => {
    const queryClient = new QueryClient()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    await invalidarApos(queryClient, 'perfil')
    expect(invalidar).toHaveBeenCalledExactlyOnceWith({ queryKey: queryKeys.usuario.eu })
  })
})
