// `test` da suíte contra a API real: cada teste ganha um usuário NOVO (e-mail único), criado pela API, sem depender
// de outro teste nem da ordem. a fixture `logado` grava o JWT no cookie httpOnly `pm_token`, como a Server Action do login faz
// (o teste do login de verdade fica em acesso.spec.ts). O callback chama `entregar`, não `use`: a regra de hooks do React no ESLint
// confunde o `use` do Playwright com o hook.
import { test as base, type BrowserContext } from '@playwright/test'
import { criarUsuario, type Usuario } from './api'

export async function entrarComToken(context: BrowserContext, baseURL: string, token: string): Promise<void> {
  await context.addCookies([{ name: 'pm_token', value: token, url: baseURL, httpOnly: true, sameSite: 'Lax' }])
}

type Fixtures = {
  /** Usuário recém-criado pela API (sem sessão no navegador). */
  usuario: Usuario
  /** Usuário recém-criado e já logado no navegador. */
  logado: Usuario
}

export const test = base.extend<Fixtures>({
  usuario: async ({}, entregar) => {
    await entregar(await criarUsuario())
  },
  logado: async ({ usuario, context, baseURL }, entregar) => {
    await entrarComToken(context, baseURL!, usuario.token)
    await entregar(usuario)
  },
})

export { expect } from '@playwright/test'

/** Mês fixo dos dados dos testes (independe do relógio): outubro de 2026. */
export const MES = 10
export const ANO = 2026
export const PERIODO = `mes=${MES}&ano=${ANO}`
