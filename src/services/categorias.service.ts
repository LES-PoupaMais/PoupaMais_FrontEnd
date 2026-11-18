import { http } from '@/lib/http'
import type { Categoria, CategoriaComContagem, CategoriaRequest, FiltrosCategorias } from '@/types/api'

// Categorias via BFF. O GET vem em ordem alfabética (ativas primeiro sem filtro) e traz `quantidadeLancamentos`
// do mês pedido (sem mês/ano, o mês atual). POST/PUT/PATCH devolvem a categoria sem a contagem.
export const categoriasService = {
  listar: (filtros: FiltrosCategorias = {}) => http.get<CategoriaComContagem[]>('/categorias', { params: filtros }),

  /** `409` se já existe uma com a mesma descrição (sem diferenciar maiúsculas) */
  criar: (dados: CategoriaRequest) => http.post<Categoria>('/categorias', { corpo: dados }),

  atualizar: (id: number, dados: CategoriaRequest) => http.put<Categoria>(`/categorias/${id}`, { corpo: dados }),

  alterarStatus: (id: number, ativa: boolean) =>
    http.patch<Categoria>(`/categorias/${id}/status`, { corpo: { ativa } }),

  /** `422` se estiver vinculada a algum lançamento */
  excluir: (id: number) => http.delete<void>(`/categorias/${id}`),
}
