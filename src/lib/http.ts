// Cliente do BFF: o navegador só chama o próprio Next (/api/...), que repassa para a API com o token.
// Converte o erro padrão da API ({ status, codigo, mensagem, erros }) em ErroApi. O `codigo` (v1.2.0) só é guardado: a tela
// mostra a `mensagem` da API ou a genérica (`traduzirErro`) e não decide nada por ele.

export type ErroCampo = { campo: string; mensagem: string }

export class ErroApi extends Error {
  readonly status: number
  readonly erros: ErroCampo[]
  /** `true` quando `message` é a `mensagem` que a própria API mandou (não uma frase do front) */
  readonly daApi: boolean
  /** Código estável que a API mandou (v1.2.0), ex.: "CATEGORIA_DUPLICADA". Sem uso nas telas. */
  readonly codigo?: string

  constructor(status: number, mensagem: string, erros: ErroCampo[] = [], daApi = false, codigo?: string) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.erros = erros
    this.daApi = daApi
    this.codigo = codigo
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
    const codigo = corpo && typeof corpo.codigo === 'string' ? corpo.codigo : undefined
    if (corpo && typeof corpo.mensagem === 'string' && corpo.mensagem.trim() !== '') {
      return new ErroApi(resposta.status, corpo.mensagem, Array.isArray(corpo.erros) ? corpo.erros : [], true, codigo)
    }
    if (corpo && Array.isArray(corpo.erros))
      return new ErroApi(resposta.status, MENSAGEM_ERRO_PADRAO, corpo.erros, false, codigo)
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
// Mensagens de erro para a tela: UM LUGAR SÓ (decisão do líder, 19/11/2026). O front não deduz a causa do erro pelo
// texto nem por um status genérico:
// - a API mandou `mensagem` → mostra como veio (toast ou aviso); `erros[]` com `campo` → cada mensagem no seu campo;
// - a API não mandou mensagem → a frase da tela para o status (`porStatus`) ou a genérica da tela (`padrao`), senão a
//   frase do status abaixo, senão a genérica do app;
// - sem conexão (0), sessão vencida (401) e erro do servidor (5xx) → sempre as frases do front.
// As mensagens entre back e front ainda vão ser repensadas (doc/pendencias.md): mude aqui, não nas telas.

/**
 * Frase de cada status quando a API não mandou mensagem. A do 401 é do Design System; as demais foram aprovadas pelo
 * líder em 19/11/2026. Só os status que o back manda (403, 413 e 429 não existem nele).
 */
export const MENSAGENS_POR_STATUS: Readonly<Record<number, string>> = {
  0: MENSAGEM_SEM_CONEXAO,
  400: 'Confira os campos destacados e tente de novo.',
  401: 'Sua sessão venceu. Entre de novo para continuar.',
  404: 'Não encontramos o que você procurou. Pode ter sido removido.',
  409: 'Isso já está cadastrado.',
  422: 'Não foi possível concluir. Confira os dados e tente de novo.',
  503: 'O servidor está indisponível no momento. Tente de novo em instantes.',
}

/** Mensagem de um campo do `erros[]` que veio sem texto. */
export const MENSAGEM_CAMPO_PADRAO = 'Confira este campo.'

export type OpcoesTraducao = {
  /**
   * Frase da tela para um status QUANDO A API NÃO MANDOU MENSAGEM (ex.: `{ 409: 'Já existe uma conta com esse
   * e-mail.' }`). Não vale para 0, 401 e 5xx, que têm sempre as frases do front.
   */
  porStatus?: Readonly<Record<number, string>>
  /** Frase genérica da tela ("Não foi possível salvar o nome."), no lugar da genérica do app, quando não há mensagem da API */
  padrao?: string
}

export type ErroTraduzido = {
  status: number
  /** Frase para o toast ou o aviso: a `mensagem` da API ou a do front (ver regra acima) */
  mensagem: string
  /** Campo → mensagem do `erros[]`, como veio da API, para `setError` (vazio quando não há `erros[]`) */
  campos: Record<string, string>
}

/** Formato mínimo aceito: `ErroApi` (BFF) ou o resultado de uma Server Action (`{ status, mensagem?, erros? }`). */
type ErroComStatus = { status: number; mensagem?: string | null; erros?: readonly ErroCampo[] }

function temStatus(erro: unknown): erro is ErroComStatus {
  return typeof erro === 'object' && erro !== null && typeof (erro as ErroComStatus).status === 'number'
}

/** Sem conexão, sessão vencida e erro do servidor: a frase é sempre do front */
function fraseSempreDoFront(status: number) {
  return status <= 0 || status === 401 || status >= 500
}

/** A `mensagem` que a API mandou, ou `null` */
function mensagemDaApi(erro: ErroComStatus): string | null {
  if (erro instanceof ErroApi) return erro.daApi ? erro.message : null
  return typeof erro.mensagem === 'string' && erro.mensagem.trim() !== '' ? erro.mensagem : null
}

/**
 * Mensagens de um erro para a tela (regra acima). Aceita `ErroApi`, `{ status, mensagem?, erros? }` (Server Action) ou
 * qualquer outra coisa (cai na mensagem genérica).
 */
export function traduzirErro(erro: unknown, opcoes: OpcoesTraducao = {}): ErroTraduzido {
  if (!temStatus(erro)) return { status: -1, mensagem: MENSAGEM_ERRO_PADRAO, campos: {} }

  const { status } = erro
  if (fraseSempreDoFront(status)) {
    const doFront = status >= 500 ? (MENSAGENS_POR_STATUS[status] ?? opcoes.padrao) : MENSAGENS_POR_STATUS[status]
    return { status, mensagem: doFront ?? MENSAGEM_ERRO_PADRAO, campos: {} }
  }
  const campos: Record<string, string> = {}
  for (const { campo, mensagem } of erro.erros ?? []) {
    if (campo) campos[campo] = mensagem?.trim() ? mensagem : MENSAGEM_CAMPO_PADRAO
  }
  const mensagem =
    mensagemDaApi(erro) ??
    opcoes.porStatus?.[status] ??
    opcoes.padrao ??
    MENSAGENS_POR_STATUS[status] ??
    MENSAGEM_ERRO_PADRAO
  return { status, mensagem, campos }
}

/** `true` para os erros que a tela não precisa avisar: 401 (o AppProviders já leva ao login) */
export function ehSessaoVencida(erro: unknown): boolean {
  return temStatus(erro) && erro.status === 401
}
