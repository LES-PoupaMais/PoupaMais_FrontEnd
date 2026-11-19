'use server'

import { encerrarSessao, gravarSessao, obterToken } from '@/lib/session'
import { excluirContaSchema, trocarSenhaSchema } from '@/schemas/perfil.schema'
import type { AlterarSenhaRequest, ExcluirContaRequest, TokenResponse } from '@/types/api'

// Server Actions do Perfil: mexem no cookie httpOnly da sessão, então chamam a API direto do servidor (não pelo BFF).
// - Trocar a senha (RN015): a API devolve um token novo (as outras sessões caem) e o cookie passa a guardar esse token.
// - Excluir a conta (RN016): exige a senha; deu certo, apaga o cookie. Quem leva para "/" com o toast é a tela.
// O resultado nunca traz a mensagem crua da API: só um motivo que a tela traduz.

const API_URL = process.env.API_URL ?? 'http://localhost:8080'

export type MotivoFalhaPerfil =
  /** 422 na troca: senha atual errada / na exclusão: senha errada */
  | 'senha-incorreta'
  /** 422 na troca: a nova é igual à atual */
  | 'senha-igual'
  /** Dados que não passam no schema (o formulário já barra antes) */
  | 'invalido'
  /** 401: sessão vencida (o cookie já foi apagado) */
  | 'sessao'
  | 'conexao'
  | 'erro'

export type ResultadoPerfil = { ok: true } | { ok: false; motivo: MotivoFalhaPerfil }

async function chamarApi(caminho: string, metodo: 'PUT' | 'POST', corpo: unknown): Promise<Response | null> {
  const token = await obterToken()
  try {
    return await fetch(new URL(`/api${caminho}`, API_URL), {
      method: metodo,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(corpo),
      cache: 'no-store',
    })
  } catch {
    return null
  }
}

async function lerMensagem(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.json()
    return typeof corpo?.mensagem === 'string' ? corpo.mensagem : ''
  } catch {
    return ''
  }
}

async function falhaComum(resposta: Response | null): Promise<ResultadoPerfil> {
  if (!resposta) return { ok: false, motivo: 'conexao' }
  if (resposta.status === 401) {
    await encerrarSessao()
    return { ok: false, motivo: 'sessao' }
  }
  return { ok: false, motivo: 'erro' }
}

/** `PUT /usuarios/me/senha`: deu certo, grava o token novo no cookie. */
export async function trocarSenhaAction(dados: AlterarSenhaRequest): Promise<ResultadoPerfil> {
  const validos = trocarSenhaSchema.safeParse({ ...dados, confirmarSenha: dados.novaSenha })
  if (!validos.success) return { ok: false, motivo: 'invalido' }

  const resposta = await chamarApi('/usuarios/me/senha', 'PUT', {
    senhaAtual: dados.senhaAtual,
    novaSenha: dados.novaSenha,
  })
  if (resposta?.ok) {
    const { token, expiraEm } = (await resposta.json()) as TokenResponse
    await gravarSessao(token, expiraEm)
    return { ok: true }
  }
  if (resposta?.status === 422) {
    // A API usa 422 para os dois casos; só a mensagem diferencia ("diferente da atual" × "atual está incorreta")
    const mensagem = (await lerMensagem(resposta)).toLowerCase()
    return { ok: false, motivo: mensagem.includes('diferente') ? 'senha-igual' : 'senha-incorreta' }
  }
  return falhaComum(resposta)
}

/** `POST /usuarios/me/excluir`: deu certo, apaga o cookie da sessão. */
export async function excluirContaAction(dados: ExcluirContaRequest): Promise<ResultadoPerfil> {
  if (!excluirContaSchema.safeParse(dados).success) return { ok: false, motivo: 'invalido' }

  const resposta = await chamarApi('/usuarios/me/excluir', 'POST', { senha: dados.senha })
  if (resposta?.ok) {
    await encerrarSessao()
    return { ok: true }
  }
  if (resposta?.status === 422) return { ok: false, motivo: 'senha-incorreta' }
  return falhaComum(resposta)
}
