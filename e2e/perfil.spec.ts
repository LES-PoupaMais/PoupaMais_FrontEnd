import { expect, test, type Page } from '@playwright/test'
import { simularApiBasica, usuarioDemo } from './fixtures/api'
import { entrarComSessaoFalsa } from './fixtures/sessao'

// Perfil (RN015/RN016). Nome, foto e "Baixar meus dados" passam pelo BFF (simulados com page.route); trocar a senha e
// excluir a conta são Server Actions, que chamam a API pelo servidor: respondem pela API falsa (e2e/api-falsa.mjs),
// onde a senha "senha-errada" dá 422.

async function simularPerfil(page: Page) {
  await simularApiBasica(page)
  await page.route('**/api/lancamentos?**', (rota) =>
    rota.fulfill({ json: { itens: [], pagina: 0, tamanho: 1, total: 3, totalPaginas: 3 } }),
  )
  await page.route('**/api/categorias**', (rota) =>
    rota.fulfill({
      json: [
        { id: 1, descricao: 'Mercado', ativa: true, quantidadeLancamentos: 2 },
        { id: 2, descricao: 'Academia', ativa: false, quantidadeLancamentos: 0 },
      ],
    }),
  )
}

async function preencherSenha(page: Page, atual: string) {
  await page.getByLabel('Senha atual').fill(atual)
  await page.getByLabel('Nova senha', { exact: true }).fill('poupa2026')
  await page.getByLabel('Confirmar nova senha').fill('poupa2026')
  await page.getByRole('button', { name: 'Alterar senha' }).click()
}

test.describe('perfil', () => {
  test.beforeEach(async ({ page, context }) => {
    await entrarComSessaoFalsa(context)
    await simularPerfil(page)
    await page.setViewportSize({ width: 1280, height: 900 })
  })

  test('mostra os dados, as contagens e renomeia', async ({ page }) => {
    await page.route('**/api/usuarios/me', async (rota) => {
      if (rota.request().method() !== 'PUT') return rota.fallback()
      return rota.fulfill({ json: { ...usuarioDemo, ...rota.request().postDataJSON() } })
    })
    await page.goto('/perfil')

    await expect(page.getByRole('heading', { level: 1, name: 'Perfil' })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toHaveValue(usuarioDemo.email)
    await expect(page.getByRole('link', { name: /3 lançamentos excluídos para restaurar/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /1 ativa e 1 inativa/ })).toBeVisible()

    await page.getByLabel('Nome').fill('Leonardo Nascimento')
    await page.getByRole('button', { name: 'Salvar nome' }).click()
    await expect(page.getByText('Nome salvo')).toBeVisible()
    // a sidebar e a foto acompanham o nome novo
    await expect(page.getByRole('img', { name: 'Avatar de Leonardo Nascimento' })).toBeVisible()
  })

  test('troca a senha: senha atual errada fica no campo; certa troca o cookie da sessão', async ({ page, context }) => {
    await page.goto('/perfil')

    await preencherSenha(page, 'senha-errada')
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
    expect((await context.cookies()).find((c) => c.name === 'pm_token')?.value).toBe('token-falso-e2e')

    await preencherSenha(page, 'poupa2025')
    await expect(page.getByText('Senha alterada')).toBeVisible()
    await expect(page.getByLabel('Senha atual')).toHaveValue('')
    const cookie = (await context.cookies()).find((c) => c.name === 'pm_token')
    expect(cookie?.value).toBe('token-novo-e2e')
    expect(cookie?.httpOnly).toBe(true)
  })

  test('troca o tema e a escolha continua depois de recarregar', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/perfil')
    await expect(page.getByRole('radio', { name: 'Sistema' })).toBeChecked()

    await page.getByRole('radio', { name: 'Escuro' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.getByRole('radio', { name: 'Escuro' })).toBeChecked()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('radio', { name: 'Claro' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('baixa meus dados com o nome do arquivo da API', async ({ page }) => {
    await page.route('**/api/usuarios/me/dados', (rota) =>
      rota.fulfill({
        body: JSON.stringify({ perfil: usuarioDemo, categorias: [], lancamentos: [] }),
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="meus-dados-poupamais.json"',
        },
      }),
    )
    await page.goto('/perfil')

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: /Baixar meus dados/ }).click()
    expect((await download).suggestedFilename()).toBe('meus-dados-poupamais.json')
    await expect(page.getByText('Seus dados foram baixados')).toBeVisible()
  })

  test('exclui a conta com EXCLUIR digitado e a senha, apaga a sessão e volta ao início', async ({ page, context }) => {
    await page.goto('/perfil')
    await page.getByRole('button', { name: /Excluir minha conta/ }).click()
    const dialogo = page.getByRole('alertdialog', { name: 'Excluir conta' })
    const excluir = dialogo.getByRole('button', { name: 'Excluir conta' })

    await dialogo.getByLabel('Sua senha').fill('senha-errada')
    await expect(excluir).toBeDisabled()
    await dialogo.getByLabel('Para confirmar, digite EXCLUIR').fill('EXCLUIR')
    await expect(dialogo.getByText('Tudo certo: o botão está liberado.')).toBeVisible()
    await excluir.click()
    await expect(dialogo.getByText('Senha incorreta.')).toBeVisible()

    await dialogo.getByLabel('Sua senha').fill('poupa2026')
    await excluir.click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Sua conta foi excluída.')).toBeVisible()
    expect((await context.cookies()).find((c) => c.name === 'pm_token')).toBeUndefined()
  })

  test('no celular, o título fica na TopBar e "Sair da conta" aparece no fim', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/perfil')

    await expect(page.getByRole('banner').getByRole('heading', { name: 'Perfil' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeVisible()
    await expect(
      page.locator('[data-slot="app-shell-bottom-nav"]').getByRole('link', { name: 'Perfil' }),
    ).toHaveAttribute('aria-current', 'page')
  })
})
