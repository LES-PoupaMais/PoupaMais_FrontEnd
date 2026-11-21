import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO } from '@/lib/sessao-cookie'

// Next 16: o antigo middleware.ts virou proxy.ts.
// Só confere a PRESENÇA do cookie; quem valida o token é a API (401 → o BFF apaga o cookie).

const ROTAS_PRIVADAS = ['/dashboard', '/lancamentos', '/categorias', '/perfil']
const ROTAS_SO_DESLOGADO = ['/login', '/cadastro']

export function proxy(request: NextRequest) {
  const logado = request.cookies.has(COOKIE_SESSAO)
  const { pathname, search } = request.nextUrl

  const privada = ROTAS_PRIVADAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
  if (privada && !logado) {
    const login = new URL('/login', request.url)
    // Guarda a página inteira (com a query: mês, filtros, ?ver=), não só o caminho
    login.searchParams.set('voltar', `${pathname}${search}`)
    return NextResponse.redirect(login)
  }

  if (logado && ROTAS_SO_DESLOGADO.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/lancamentos/:path*', '/categorias/:path*', '/perfil/:path*', '/login', '/cadastro'],
}
