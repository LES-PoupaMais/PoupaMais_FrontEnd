import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { usuarioService } from '@/services/usuario.service'

/** Usuário logado (nome e avatar na Sidebar, TopBar e Perfil) */
export function useUsuario() {
  return useQuery({ queryKey: queryKeys.usuario.eu, queryFn: usuarioService.obter, staleTime: 5 * 60_000 })
}

/**
 * Foto do avatar (Sidebar/TopBar/Perfil): a URL do BFF quando `possuiFoto`, senão `null` (o avatar mostra a inicial).
 * `versao` muda a URL quando os dados do usuário são recarregados (ex.: `dataUpdatedAt` do `useUsuario`), para o
 * navegador não reaproveitar a foto antiga depois de uma troca.
 */
export function fotoDoUsuario(usuario: { possuiFoto: boolean } | undefined, versao: number | string): string | null {
  return usuario?.possuiFoto ? usuarioService.urlDaFoto(versao) : null
}
