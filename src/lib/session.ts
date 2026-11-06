import 'server-only'
import { cookies } from 'next/headers'
import { COOKIE_SESSAO } from './sessao-cookie'

// Sessão do usuário: o JWT da API fica num cookie httpOnly, invisível para o JavaScript da página.
// Com cacheComponents ligado, componentes que leem cookies precisam ficar dentro de <Suspense>.

export async function obterToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_SESSAO)?.value
}

export async function gravarSessao(token: string, expiraEm: string): Promise<void> {
  ;(await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiraEm),
  })
}

export async function encerrarSessao(): Promise<void> {
  ;(await cookies()).delete(COOKIE_SESSAO)
}
