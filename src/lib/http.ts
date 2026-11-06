// Cliente do BFF: o navegador só chama o próprio Next (/api/...), que repassa para a API com o token.
// Converte o erro padrão da API ({ status, mensagem, erros }) em ErroApi.

export type ErroCampo = { campo: string; mensagem: string }

export class ErroApi extends Error {
  readonly status: number
  readonly erros: ErroCampo[]

  constructor(status: number, mensagem: string, erros: ErroCampo[] = []) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.erros = erros
  }
}

export const MENSAGEM_ERRO_PADRAO = 'Não foi possível concluir a operação. Tente novamente.'
export const MENSAGEM_SEM_CONEXAO = 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'

type Parametros = Record<string, string | number | boolean | null | undefined>

export type OpcoesRequisicao = Omit<RequestInit, 'body' | 'method'> & {
  corpo?: unknown
  params?: Parametros
}

function montarUrl(caminho: string, params?: Parametros): URL {
  const origem = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  const url = new URL(`/api${caminho}`, origem)
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') {
      url.searchParams.set(chave, String(valor))
    }
  }
  return url
}

async function lerErro(resposta: Response): Promise<ErroApi> {
  try {
    const corpo = await resposta.json()
    if (corpo && typeof corpo.mensagem === 'string') {
      return new ErroApi(resposta.status, corpo.mensagem, Array.isArray(corpo.erros) ? corpo.erros : [])
    }
  } catch {
    // corpo vazio ou não-JSON: cai na mensagem padrão
  }
  return new ErroApi(resposta.status, MENSAGEM_ERRO_PADRAO)
}

export async function requisitar<T>(
  metodo: string,
  caminho: string,
  { corpo, params, headers, ...opcoes }: OpcoesRequisicao = {},
): Promise<T> {
  const ehFormulario = corpo instanceof FormData
  const cabecalhos = new Headers(headers)
  cabecalhos.set('Accept', 'application/json')
  if (corpo !== undefined && !ehFormulario) {
    cabecalhos.set('Content-Type', 'application/json')
  }

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, params), {
      ...opcoes,
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : ehFormulario ? corpo : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroApi(0, MENSAGEM_SEM_CONEXAO)
  }

  if (!resposta.ok) {
    throw await lerErro(resposta)
  }
  if (resposta.status === 204) {
    return undefined as T
  }
  const tipo = resposta.headers.get('Content-Type') ?? ''
  return (tipo.includes('application/json') ? await resposta.json() : await resposta.blob()) as T
}

export const http = {
  get: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('GET', caminho, opcoes),
  post: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('POST', caminho, opcoes),
  put: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('PUT', caminho, opcoes),
  patch: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('PATCH', caminho, opcoes),
  delete: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('DELETE', caminho, opcoes),
}
