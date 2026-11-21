'use server'

import { chamarApiDoServidor } from '@/lib/api-servidor'
import type { ErroCampo } from '@/lib/http'
import { encerrarSessao, gravarSessao, obterToken } from '@/lib/session'
import { excluirContaSchema, trocarSenhaSchema } from '@/schemas/perfil.schema'
import type { AlterarSenhaRequest, ExcluirContaRequest, TokenResponse } from '@/types/api'

// Server Actions do Perfil: mexem no cookie httpOnly da sessão, então chamam a API direto do servidor (não pelo BFF).
// - Trocar a senha (RN015): a API devolve um token novo (as outras sessões caem) e o cookie passa a guardar esse token.
// - Excluir a conta (RN016): exige a senha; deu certo, apaga o cookie. Quem leva para "/" com o toast é a tela.
// Em erro, devolve o `status`, a `mensagem` e os `erros[]` da API como vieram: a tela mostra com `traduzirErro`
// (lib/http). A action não deduz a causa pelo texto. 401 = sessão vencida (o cookie já foi apagado).

export type ResultadoPerfil = { ok: true } | { ok: false; status: number; mensagem: string | null; erros: ErroCampo[] }

const INVALIDO: ResultadoPerfil = { ok: false, status: 400, mensagem: null, erros: [] }

async function chamar<T>(caminho: string, metodo: 'PUT' | 'POST', corpo: unknown) {
  const token = await obterToken()
  const resposta = await chamarApiDoServidor<T>(metodo, caminho, { corpo, token })
  if (!resposta.ok && resposta.status === 401) await encerrarSessao()
  return resposta
}

/** `PUT /usuarios/me/senha`: deu certo, grava o token novo no cookie. */
export async function trocarSenhaAction(dados: AlterarSenhaRequest): Promise<ResultadoPerfil> {
  const validos = trocarSenhaSchema.safeParse({ ...dados, confirmarSenha: dados.novaSenha })
  if (!validos.success) return INVALIDO

  const resposta = await chamar<TokenResponse>('/usuarios/me/senha', 'PUT', {
    senhaAtual: dados.senhaAtual,
    novaSenha: dados.novaSenha,
  })
  if (!resposta.ok) return resposta
  await gravarSessao(resposta.dados.token, resposta.dados.expiraEm)
  return { ok: true }
}

/** `POST /usuarios/me/excluir`: deu certo, apaga o cookie da sessão. */
export async function excluirContaAction(dados: ExcluirContaRequest): Promise<ResultadoPerfil> {
  if (!excluirContaSchema.safeParse(dados).success) return INVALIDO

  const resposta = await chamar('/usuarios/me/excluir', 'POST', { senha: dados.senha })
  if (!resposta.ok) return resposta
  await encerrarSessao()
  return { ok: true }
}
