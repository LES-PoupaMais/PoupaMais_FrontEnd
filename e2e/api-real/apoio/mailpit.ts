// Lê os e-mails da pilha E2E pela API HTTP do Mailpit (http://localhost:8525/api/v1). Usado no "esqueci a senha".
import { expect } from '@playwright/test'

export const URL_MAILPIT = process.env.MAILPIT_URL_E2E ?? 'http://localhost:8525'

type Resumo = { ID: string; To: { Address: string }[]; Subject: string }

async function mensagensPara(email: string): Promise<Resumo[]> {
  const busca = new URLSearchParams({ query: `to:"${email}"` })
  const resposta = await fetch(`${URL_MAILPIT}/api/v1/search?${busca}`)
  if (!resposta.ok) throw new Error(`Mailpit: HTTP ${resposta.status}`)
  return ((await resposta.json()) as { messages: Resumo[] }).messages
}

/**
 * Espera o e-mail de recuperação chegar para `email` e devolve o caminho do link (`/redefinir-senha?token=...`).
 * Só o caminho: o domínio do link vem do FRONT_URL da pilha, e o teste abre no Next que o Playwright subiu.
 */
export async function linkDeRedefinicao(email: string): Promise<string> {
  let id = ''
  await expect
    .poll(
      async () => {
        id = (await mensagensPara(email))[0]?.ID ?? ''
        return id
      },
      { message: `e-mail de recuperação para ${email} no Mailpit`, timeout: 20_000 },
    )
    .not.toBe('')
  const resposta = await fetch(`${URL_MAILPIT}/api/v1/message/${id}`)
  const mensagem = (await resposta.json()) as { HTML: string; Text: string }
  const achado = `${mensagem.Text}\n${mensagem.HTML}`.match(/\/redefinir-senha\?token=[A-Za-z0-9_-]+/)
  if (!achado) throw new Error('O e-mail de recuperação não tem o link /redefinir-senha?token=')
  return achado[0]
}

export async function quantidadeDeEmails(email: string): Promise<number> {
  return (await mensagensPara(email)).length
}
