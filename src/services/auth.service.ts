import { http } from '@/lib/http'
import type { RecuperarSenhaRequest, RedefinirSenhaRequest } from '@/types/api'

// Recuperação de senha (RN014) via BFF: rotas públicas da API que não mexem no cookie.
// Login, cadastro e logout NÃO passam por aqui: são Server Actions (actions/auth.actions.ts), porque gravam o cookie.
export const authService = {
  /** `202` sempre, exista a conta ou não: a tela nunca diz se o e-mail existe */
  recuperarSenha: (dados: RecuperarSenhaRequest) => http.post<void>('/auth/recuperar-senha', { corpo: dados }),

  /** `204`; token inválido, expirado ou já usado → `422` */
  redefinirSenha: (dados: RedefinirSenhaRequest) => http.post<void>('/auth/redefinir-senha', { corpo: dados }),
}
