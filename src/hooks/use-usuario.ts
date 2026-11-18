import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { usuarioService } from '@/services/usuario.service'

/** Usuário logado (nome e avatar na Sidebar, TopBar e Perfil) */
export function useUsuario() {
  return useQuery({ queryKey: queryKeys.usuario.eu, queryFn: usuarioService.obter, staleTime: 5 * 60_000 })
}
