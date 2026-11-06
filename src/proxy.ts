import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO } from '@/lib/sessao-cookie'

// Next 16: o antigo middleware.ts virou proxy.ts.
// Só confere a PRESENÇA do cookie; quem valida o token é a API (401 → o BFF apaga o cookie).

const ROTAS_PRIVADAS = ['/dashboard', '/lancamentos', '/perfil']
const ROTAS_SO_DESLOGADO = ['/login', '/cadastro']

export function proxy(request: NextRequest) {
  const logado = request.cookies.has(COOKIE_SESSAO)
  const { pathname } = request.nextUrl

  const privada = ROTAS_PRIVADAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
  if (privada && !logado) {
    const login = new URL('/login', request.url)
    login.searchParams.set('voltar', pathname)
    return NextResponse.redirect(login)
  }

  if (logado && ROTAS_SO_DESLOGADO.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/lancamentos/:path*', '/perfil/:path*', '/login', '/cadastro'],
}
