import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { COOKIE_SESSAO } from '@/lib/sessao-cookie'

// BFF: o navegador chama /api/... no próprio Next e este handler repassa para ${API_URL}/api/...
// com o JWT do cookie httpOnly. O token e a URL da API nunca chegam ao navegador.

const API_URL = process.env.API_URL ?? 'http://localhost:8080'
const CABECALHOS_DA_RESPOSTA = ['content-type', 'content-disposition', 'cache-control']

async function repassar(request: NextRequest, contexto: RouteContext<'/api/[...path]'>): Promise<Response> {
  const { path } = await contexto.params
  const destino = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, API_URL)
  destino.search = request.nextUrl.search

  const loja = await cookies()
  const token = loja.get(COOKIE_SESSAO)?.value

  const cabecalhos = new Headers({ Accept: request.headers.get('accept') ?? '*/*' })
  const tipoConteudo = request.headers.get('content-type')
  if (tipoConteudo) cabecalhos.set('Content-Type', tipoConteudo) // mantém o boundary do multipart (upload de CSV e foto)
  if (token) cabecalhos.set('Authorization', `Bearer ${token}`)

  const temCorpo = request.method !== 'GET' && request.method !== 'HEAD'

  let resposta: Response
  try {
    resposta = await fetch(destino, {
      method: request.method,
      headers: cabecalhos,
      body: temCorpo ? request.body : undefined,
      // duplex é exigido pelo fetch do Node para enviar um corpo em stream
      ...(temCorpo ? { duplex: 'half' } : {}),
      cache: 'no-store',
      redirect: 'manual',
    } as RequestInit)
  } catch {
    return Response.json(
      { status: 503, mensagem: 'Não foi possível conectar ao servidor. Tente novamente em instantes.' },
      { status: 503 },
    )
  }

  // Token inválido ou expirado: derruba a sessão local
  if (resposta.status === 401) {
    loja.delete(COOKIE_SESSAO)
  }

  const cabecalhosResposta = new Headers()
  for (const nome of CABECALHOS_DA_RESPOSTA) {
    const valor = resposta.headers.get(nome)
    if (valor) cabecalhosResposta.set(nome, valor)
  }

  return new Response(resposta.body, { status: resposta.status, headers: cabecalhosResposta })
}

export { repassar as GET, repassar as POST, repassar as PUT, repassar as PATCH, repassar as DELETE }
