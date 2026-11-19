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

export type Parametros = Record<string, string | number | boolean | null | undefined>

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

export type ArquivoBaixado = { blob: Blob; nomeArquivo: string | null }

/** `attachment; filename="lancamentos.csv"` → "lancamentos.csv" (aceita também `filename*=UTF-8''…`) */
export function nomeDoArquivo(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (utf8) return decodeURIComponent(utf8[1].trim())
  const simples = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return simples ? simples[1].trim() : null
}

/** Download (exportar, modelo CSV, meus dados): devolve o arquivo e o nome vindo do `Content-Disposition`. */
export async function baixar(caminho: string, params?: Parametros): Promise<ArquivoBaixado> {
  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, params), { method: 'GET' })
  } catch {
    throw new ErroApi(0, MENSAGEM_SEM_CONEXAO)
  }
  if (!resposta.ok) {
    throw await lerErro(resposta)
  }
  return { blob: await resposta.blob(), nomeArquivo: nomeDoArquivo(resposta.headers.get('Content-Disposition')) }
}

export const http = {
  get: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('GET', caminho, opcoes),
  post: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('POST', caminho, opcoes),
  put: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('PUT', caminho, opcoes),
  patch: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('PATCH', caminho, opcoes),
  delete: <T>(caminho: string, opcoes?: OpcoesRequisicao) => requisitar<T>('DELETE', caminho, opcoes),
  baixar,
}

// ---------------------------------------------------------------------------------------------------------------------
// Tradução de erros para a tela (DS, Voz e texto): nenhuma tela mostra a mensagem crua da API. O status HTTP e o
// `erros[]` viram mensagens do Design System. Use em toasts, avisos (ActionBanner) e nos campos (setError do RHF).
// Aditivo: o ErroApi continua igual; quem já usa `erro.message` segue funcionando, mas telas novas usam `traduzirErro`.

/** Mensagem padrão de cada status (pode ser trocada por tela em `opcoes.porStatus`). */
export const MENSAGENS_POR_STATUS: Readonly<Record<number, string>> = {
  0: MENSAGEM_SEM_CONEXAO,
  400: 'Confira os campos destacados e tente de novo.',
  401: 'Sua sessão venceu. Entre de novo para continuar.',
  403: 'Você não tem acesso a este conteúdo.',
  404: 'Não encontramos o que você procurou. Pode ter sido removido.',
  409: 'Isso já está cadastrado.',
  413: 'O arquivo é grande demais.',
  422: 'Não foi possível concluir. Confira os dados e tente de novo.',
  429: 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
  503: 'O servidor está indisponível no momento. Tente de novo em instantes.',
}

/** Mensagem de um campo vindo do `erros[]` quando a tela não tem uma própria para ele. */
export const MENSAGEM_CAMPO_PADRAO = 'Confira este campo.'

export type OpcoesTraducao = {
  /** Mensagens próprias da tela por status (ex.: `{ 409: 'Já existe uma conta com esse e-mail.' }`) */
  porStatus?: Readonly<Record<number, string>>
  /** Mensagens próprias por campo do `erros[]` (ex.: `{ email: 'Informe um e-mail válido.' }`) */
  porCampo?: Readonly<Record<string, string>>
}

export type ErroTraduzido = {
  status: number
  /** Frase para o toast ou o aviso, já no tom do DS */
  mensagem: string
  /** Campo → mensagem, para `setError` (vazio quando a API não mandou `erros[]`) */
  campos: Record<string, string>
}

/** Formato mínimo aceito: `ErroApi` (BFF) ou o resultado de uma Server Action (`{ status, erros }`). */
type ErroComStatus = { status: number; erros?: readonly ErroCampo[] }

function temStatus(erro: unknown): erro is ErroComStatus {
  return typeof erro === 'object' && erro !== null && typeof (erro as ErroComStatus).status === 'number'
}

/**
 * Traduz qualquer erro para mensagens do DS. Aceita `ErroApi`, `{ status, erros }` (Server Action) ou qualquer outra
 * coisa (cai na mensagem padrão). Nunca devolve a `mensagem` da API.
 */
export function traduzirErro(erro: unknown, opcoes: OpcoesTraducao = {}): ErroTraduzido {
  if (!temStatus(erro)) return { status: -1, mensagem: MENSAGEM_ERRO_PADRAO, campos: {} }

  const { status } = erro
  const campos: Record<string, string> = {}
  for (const { campo } of erro.erros ?? []) {
    if (campo) campos[campo] = opcoes.porCampo?.[campo] ?? MENSAGEM_CAMPO_PADRAO
  }
  const mensagem = opcoes.porStatus?.[status] ?? MENSAGENS_POR_STATUS[status] ?? MENSAGEM_ERRO_PADRAO
  return { status, mensagem, campos }
}
