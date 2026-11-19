import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { usuarioService } from '@/services/usuario.service'
import type { AtualizarUsuarioRequest, Usuario } from '@/types/api'

// Mutations do Perfil (RN015/RN016). Troca de senha e exclusão de conta são Server Actions (actions/perfil.actions.ts).
// Toasts e erros de campo ficam no Context da tela (onSuccess/onError do `mutate`).

/** Salva o nome. A resposta já é o perfil novo: atualiza o cache do usuário (Sidebar, TopBar e Perfil) sem buscar de novo. */
export function useAtualizarNome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: AtualizarUsuarioRequest) => usuarioService.atualizar(dados),
    onSuccess: (usuario) => queryClient.setQueryData<Usuario>(queryKeys.usuario.eu, usuario),
  })
}

/**
 * Depois de trocar ou remover a foto: marca `possuiFoto` na hora e recarrega o usuário. As duas coisas mudam o
 * `dataUpdatedAt` do `useUsuario`, que é a versão da URL do avatar (`?v=`): o navegador não reaproveita a foto antiga.
 */
function aposMudarFoto(queryClient: ReturnType<typeof useQueryClient>, possuiFoto: boolean) {
  queryClient.setQueryData<Usuario>(queryKeys.usuario.eu, (atual) => (atual ? { ...atual, possuiFoto } : atual))
  return queryClient.invalidateQueries({ queryKey: queryKeys.usuario.eu })
}

/** JPG, PNG ou WEBP até 2 MB: valide com `validarFoto` (schemas/perfil.schema) antes de chamar. */
export function useTrocarFoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (foto: File) => usuarioService.trocarFoto(foto),
    onSuccess: () => aposMudarFoto(queryClient, true),
  })
}

export function useRemoverFoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => usuarioService.removerFoto(),
    onSuccess: () => aposMudarFoto(queryClient, false),
  })
}

/** "Baixar meus dados" (LGPD): devolve o arquivo e o nome do `Content-Disposition`; quem salva é a tela. */
export function useBaixarMeusDados() {
  return useMutation({ mutationFn: () => usuarioService.baixarDados() })
}
