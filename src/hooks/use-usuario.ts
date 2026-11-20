import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { usuarioService } from '@/services/usuario.service'
import type { Usuario } from '@/types/api'
import { useHidratado } from './use-hidratado'

/**
 * Usuário logado (nome e avatar na Sidebar, TopBar e Perfil).
 *
 * Na hidratação devolve o estado "carregando", igual ao HTML do servidor (que não tem o usuário). Sem isso, a casca
 * busca o usuário logo que hidrata e a página (que hidrata depois, em outro Suspense) já o encontrava no cache:
 * o cliente desenhava o nome ("Olá, Leonardo", o Perfil inteiro) onde o servidor desenhou o esqueleto e o React
 * acusava o erro de hidratação #418 (Dashboard e Perfil no celular e no tablet).
 */
export function useUsuario(): UseQueryResult<Usuario> {
  const hidratado = useHidratado()
  const consulta = useQuery({ queryKey: queryKeys.usuario.eu, queryFn: usuarioService.obter, staleTime: 5 * 60_000 })
  if (hidratado) return consulta
  return {
    ...consulta,
    data: undefined,
    error: null,
    status: 'pending',
    isPending: true,
    isLoading: true,
    isSuccess: false,
    isError: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
  } as UseQueryResult<Usuario>
}

/**
 * Foto do avatar (Sidebar/TopBar/Perfil): a URL do BFF quando `possuiFoto`, senão `null` (o avatar mostra a inicial).
 * `versao` muda a URL quando os dados do usuário são recarregados (ex.: `dataUpdatedAt` do `useUsuario`), para o
 * navegador não reaproveitar a foto antiga depois de uma troca.
 */
export function fotoDoUsuario(usuario: { possuiFoto: boolean } | undefined, versao: number | string): string | null {
  return usuario?.possuiFoto ? usuarioService.urlDaFoto(versao) : null
}
