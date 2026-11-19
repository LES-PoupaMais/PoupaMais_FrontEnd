'use server'

import { redirect } from 'next/navigation'
import { ROTAS } from '@/constants/rotas'
import { chamarApiDoServidor } from '@/lib/api-servidor'
import type { ErroCampo } from '@/lib/http'
import { encerrarSessao, gravarSessao } from '@/lib/session'
import { cadastroSchema, loginSchema, type CadastroInput, type LoginInput } from '@/schemas/auth.schema'
import type { LoginResponse } from '@/types/api'

// Server Actions de autenticação. O JWT vive só no cookie httpOnly `pm_token` (lib/session), invisível para a página.
// A API não tem endpoint de logout (o token expira sozinho): sair = apagar o cookie e voltar ao login.

/**
 * Resultado de login e cadastro (serializável). A tela traduz o erro com `traduzirErro` (lib/http):
 * `status` 0 = sem conexão, 400 = `erros[]` por campo, 401 = credenciais inválidas, 409 = e-mail já usado.
 */
export type ResultadoAuth = { ok: true } | { ok: false; status: number; erros: ErroCampo[] }

function errosDaValidacao(issues: { path: PropertyKey[] }[]): ErroCampo[] {
  return issues.map((issue) => ({ campo: issue.path.join('.'), mensagem: '' }))
}

async function entrar(email: string, senha: string): Promise<ResultadoAuth> {
  const resposta = await chamarApiDoServidor<LoginResponse>('POST', '/auth/login', { corpo: { email, senha } })
  if (!resposta.ok) return { ok: false, status: resposta.status, erros: resposta.erros }
  await gravarSessao(resposta.dados.token, resposta.dados.expiraEm)
  return { ok: true }
}

/** Login (RF010): grava o cookie da sessão. Quem decide para onde ir (`?voltar=`) é a tela. */
export async function loginAction(dados: LoginInput): Promise<ResultadoAuth> {
  const validado = loginSchema.safeParse(dados)
  if (!validado.success) return { ok: false, status: 400, erros: errosDaValidacao(validado.error.issues) }
  return entrar(validado.data.email, validado.data.senha)
}

/**
 * Cadastro (RF009, RN011, aceite da Política): cria a conta e já entra (a API devolve 201 sem token, então a action
 * faz o login em seguida). `409` = e-mail já usado.
 */
export async function cadastroAction(dados: CadastroInput): Promise<ResultadoAuth> {
  const validado = cadastroSchema.safeParse(dados)
  if (!validado.success) return { ok: false, status: 400, erros: errosDaValidacao(validado.error.issues) }

  const { nome, email, senha, aceiteTermos } = validado.data
  const criado = await chamarApiDoServidor('POST', '/auth/cadastro', { corpo: { nome, email, senha, aceiteTermos } })
  if (!criado.ok) return { ok: false, status: criado.status, erros: criado.erros }
  return entrar(email, senha)
}

/** "Sair" (Sidebar): apaga o cookie da sessão e leva para /login. O `redirect` interrompe a action (não retorna). */
export async function logoutAction(): Promise<void> {
  await encerrarSessao()
  redirect(ROTAS.login)
}
