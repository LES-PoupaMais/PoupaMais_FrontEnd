'use server'

import { redirect } from 'next/navigation'
import { ROTAS } from '@/constants/rotas'
import { encerrarSessao } from '@/lib/session'

// Server Actions de autenticação. O JWT vive só no cookie httpOnly `pm_token` (lib/session), invisível para a página.
// A API não tem endpoint de logout (o token expira sozinho): sair = apagar o cookie e voltar ao login.

/** "Sair" (Sidebar): apaga o cookie da sessão e leva para /login. O `redirect` interrompe a action (não retorna). */
export async function logoutAction(): Promise<void> {
  await encerrarSessao()
  redirect(ROTAS.login)
}
