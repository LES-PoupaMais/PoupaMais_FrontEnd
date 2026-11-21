import 'server-only'
import type { ErroCampo } from './http'

// Chamada à API Spring feita PELO SERVIDOR do Next (Server Actions: login, cadastro, troca de senha, excluir conta).
// O navegador nunca vê a URL da API nem o token. As telas usam o `lib/http` (BFF); isto é só para `actions/`.
// Devolve um resultado simples e serializável: em erro, `status`, a `mensagem` da API (ou `null`) e os `erros[]`, que a
// action repassa para a tela mostrar com `traduzirErro` (lib/http, a regra de mensagens de 19/11). O `codigo` (v1.2.0) vem
// junto quando a API manda, sem uso nas telas.

export type RespostaDoServidor<T> =
  | { ok: true; status: number; dados: T }
  | { ok: false; status: number; mensagem: string | null; erros: ErroCampo[]; codigo?: string }

/** URL da API lida a cada chamada (o E2E troca por uma API falsa com a variável de ambiente). */
function urlDaApi(): string {
  return process.env.API_URL ?? 'http://localhost:8080'
}

export async function chamarApiDoServidor<T = unknown>(
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  caminho: string,
  { corpo, token }: { corpo?: unknown; token?: string } = {},
): Promise<RespostaDoServidor<T>> {
  const cabecalhos = new Headers({ Accept: 'application/json' })
  if (corpo !== undefined) cabecalhos.set('Content-Type', 'application/json')
  if (token) cabecalhos.set('Authorization', `Bearer ${token}`)

  let resposta: Response
  try {
    resposta = await fetch(new URL(`/api${caminho}`, urlDaApi()), {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, mensagem: null, erros: [] } // sem conexão com a API
  }

  const json: unknown = await resposta.json().catch(() => undefined)
  if (!resposta.ok) {
    const { erros, mensagem, codigo } = (json ?? {}) as { erros?: unknown; mensagem?: unknown; codigo?: unknown }
    return {
      ok: false,
      status: resposta.status,
      mensagem: typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : null,
      erros: Array.isArray(erros) ? erros.filter((e): e is ErroCampo => typeof e?.campo === 'string') : [],
      ...(typeof codigo === 'string' ? { codigo } : {}),
    }
  }
  return { ok: true, status: resposta.status, dados: json as T }
}
