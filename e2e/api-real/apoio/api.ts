// Cliente da API REAL (pilha E2E do PoupaMais_Development, `npm run e2e:up`), usado só para MONTAR os dados de cada teste
// (usuário, categorias, lançamentos) e conferir o que a tela gravou. O que o teste prova passa pela tela.
import { randomUUID } from 'node:crypto'

export const URL_API = process.env.API_URL_E2E ?? 'http://localhost:8580'

export type Usuario = { id: number; nome: string; email: string; senha: string; token: string }

export type Lancamento = {
  id: number
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  data: string
  valor: number
  status: 'ATIVO' | 'INATIVO' | 'DELETADO'
  categorias: { id: number; descricao: string }[]
}

export type NovoLancamento = {
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  data: string
  valor: number
  categoriaIds: number[]
  status?: 'ATIVO' | 'INATIVO'
}

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly corpo: string,
    contexto: string,
  ) {
    super(`${contexto}: HTTP ${status} ${corpo}`)
  }
}

/** E-mail que nunca se repete entre testes nem entre execuções (o banco da pilha só zera no e2e:reset). */
export function emailUnico(prefixo = 'e2e'): string {
  return `${prefixo}-${randomUUID().slice(0, 12)}@e2e.poupamais.local`
}

export async function chamarApi<T = unknown>(
  metodo: string,
  caminho: string,
  { token, corpo }: { token?: string; corpo?: unknown } = {},
): Promise<{ status: number; dados: T }> {
  const resposta = await fetch(`${URL_API}/api/${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  const texto = await resposta.text()
  if (!resposta.ok) throw new ErroApi(resposta.status, texto, `${metodo} /api/${caminho}`)
  return { status: resposta.status, dados: (texto ? JSON.parse(texto) : undefined) as T }
}

export async function entrarNaApi(email: string, senha: string): Promise<{ token: string; id: number; nome: string }> {
  const { dados } = await chamarApi<{ token: string; usuario: { id: number; nome: string } }>('POST', 'auth/login', {
    corpo: { email, senha },
  })
  return { token: dados.token, id: dados.usuario.id, nome: dados.usuario.nome }
}

/** Cria um usuário novo (e-mail único) e já devolve o token da API. */
export async function criarUsuario({
  nome = 'Pessoa de Teste',
  senha = 'senha123',
  prefixo = 'e2e',
}: { nome?: string; senha?: string; prefixo?: string } = {}): Promise<Usuario> {
  const email = emailUnico(prefixo)
  await chamarApi('POST', 'auth/cadastro', { corpo: { nome, email, senha, aceiteTermos: true } })
  const { token, id } = await entrarNaApi(email, senha)
  return { id, nome, email, senha, token }
}

/**
 * Id da categoria `descricao`: usa a que já existe (o cadastro cria as 11 categorias padrão, como Salário e Moradia; RN002)
 * ou cria uma nova.
 */
export async function categoria(usuario: Usuario, descricao: string): Promise<number> {
  const existente = (await listarCategorias(usuario)).find(
    (c) => c.descricao.toLocaleLowerCase('pt-BR') === descricao.toLocaleLowerCase('pt-BR'),
  )
  return existente?.id ?? criarCategoria(usuario, descricao)
}

export async function criarCategoria(usuario: Usuario, descricao: string): Promise<number> {
  const { dados } = await chamarApi<{ id: number }>('POST', 'categorias', {
    token: usuario.token,
    corpo: { descricao },
  })
  return dados.id
}

export async function criarLancamento(usuario: Usuario, novo: NovoLancamento): Promise<Lancamento> {
  const { dados } = await chamarApi<Lancamento>('POST', 'lancamentos', { token: usuario.token, corpo: novo })
  return dados
}

export async function alterarStatus(usuario: Usuario, id: number, status: 'ATIVO' | 'INATIVO'): Promise<void> {
  await chamarApi('PATCH', `lancamentos/${id}/status`, { token: usuario.token, corpo: { status } })
}

export async function moverParaLixeira(usuario: Usuario, id: number): Promise<void> {
  await chamarApi('DELETE', `lancamentos/${id}`, { token: usuario.token })
}

export async function buscarLancamento(usuario: Usuario, id: number): Promise<Lancamento> {
  return (await chamarApi<Lancamento>('GET', `lancamentos/${id}`, { token: usuario.token })).dados
}

export async function listarLancamentos(usuario: Usuario, filtros: Record<string, string> = {}): Promise<Lancamento[]> {
  const busca = new URLSearchParams({ tamanho: '100', ...filtros })
  const { dados } = await chamarApi<{ itens: Lancamento[] }>('GET', `lancamentos?${busca}`, { token: usuario.token })
  return dados.itens
}

export async function listarCategorias(usuario: Usuario): Promise<{ id: number; descricao: string; ativa: boolean }[]> {
  return (
    await chamarApi<{ id: number; descricao: string; ativa: boolean }[]>('GET', 'categorias', { token: usuario.token })
  ).dados
}

export type Dashboard = { receitas: number; despesas: number; saldo: number; mensagem: string }

export async function buscarDashboard(usuario: Usuario, mes: number, ano: number): Promise<Dashboard> {
  return (await chamarApi<Dashboard>('GET', `dashboard?mes=${mes}&ano=${ano}`, { token: usuario.token })).dados
}

/** A API está de pé? (rota protegida sem token responde 401) */
export async function apiNoAr(): Promise<boolean> {
  try {
    const resposta = await fetch(`${URL_API}/api/categorias`)
    return resposta.status === 401
  } catch {
    return false
  }
}
