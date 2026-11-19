import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import type { RecuperarSenhaRequest, RedefinirSenhaRequest } from '@/types/api'

// Esqueci a senha e Redefinir senha (RN014). Sem cache para invalidar (a pessoa não está logada).
// Toasts e navegação ficam no Context da tela.

export function useRecuperarSenha() {
  return useMutation({ mutationFn: (dados: RecuperarSenhaRequest) => authService.recuperarSenha(dados) })
}

export function useRedefinirSenha() {
  return useMutation({ mutationFn: (dados: RedefinirSenhaRequest) => authService.redefinirSenha(dados) })
}
