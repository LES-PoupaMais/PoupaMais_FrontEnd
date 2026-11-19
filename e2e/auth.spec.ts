import { expect, test, type Page } from '@playwright/test'
import { simularApiBasica } from './fixtures/api'

// Login e cadastro passam por Server Action (servidor do Next → API), atendidas pela API falsa (e2e/api-falsa.mjs):
// senha "senha-errada" → 401, e-mail "usado@poupamais.com.br" → 409. Esqueci/redefinir passam pelo BFF (mesma API falsa).

async function entrar(page: Page, senha = 'senha123') {
  await page.getByLabel('E-mail').fill('demo@poupamais.com.br')
  await page.getByLabel('Senha', { exact: true }).fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test.describe('login', () => {
  test('com sucesso, grava a sessão e abre o dashboard', async ({ page, context }) => {
    await simularApiBasica(page)
    await page.goto('/login')

    await entrar(page)

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'pm_token')).toMatchObject({ httpOnly: true })
  })

  test('com senha errada, mostra o erro genérico e continua no login', async ({ page }) => {
    await page.goto('/login')

    await entrar(page, 'senha-errada')

    await expect(page.getByRole('form', { name: 'Entrar' }).getByRole('alert')).toHaveText(
      'E-mail ou senha incorretos.',
    )
    await expect(page).toHaveURL(/\/login$/)
  })

  test('valida os campos antes de enviar', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('Informe o e-mail.')).toBeVisible()
    await expect(page.getByText('Informe a senha.')).toBeVisible()
  })

  test('volta para a página pedida (com o mês) depois de entrar', async ({ page }) => {
    await simularApiBasica(page)
    await page.goto('/dashboard?mes=3&ano=2026')
    await expect(page).toHaveURL(/\/login\?voltar=%2Fdashboard/)

    await page.goto('/login?voltar=%2Fdashboard%3Fmes%3D3%26ano%3D2026')
    await entrar(page)

    await expect(page).toHaveURL(/\/dashboard\?mes=3&ano=2026$/)
  })

  test('sessão vencida: aviso e a tela para onde volta', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login?voltar=%2Flancamentos%2Fnovo&sessao=vencida')

    await expect(page.getByRole('heading', { level: 1, name: 'Entre de novo' })).toBeVisible()
    await expect(page.getByText('Sua sessão venceu. Entre de novo para continuar.')).toBeVisible()
    await expect(page.getByText('Depois de entrar, você volta para a tela Novo lançamento.')).toBeVisible()
  })
})

test.describe('cadastro', () => {
  async function preencher(page: Page, email: string) {
    await page.getByLabel('Nome completo').fill('Ana Souza')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill('123456')
    await page.getByLabel('Confirmar senha').fill('123456')
    await page.getByRole('checkbox', { name: /Li e aceito/ }).click()
    await page.getByRole('button', { name: 'Criar conta' }).click()
  }

  test('cria a conta e entra direto no dashboard', async ({ page }) => {
    await simularApiBasica(page)
    await page.goto('/cadastro')

    await preencher(page, 'ana@poupamais.com.br')

    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('e-mail já usado aparece no campo', async ({ page }) => {
    await page.goto('/cadastro')

    await preencher(page, 'usado@poupamais.com.br')

    await expect(page.getByText('Já existe uma conta com esse e-mail.')).toBeVisible()
    await expect(page).toHaveURL(/\/cadastro$/)
  })

  test('sem o aceite, mostra o resumo e o erro da Política', async ({ page }) => {
    await page.goto('/cadastro')

    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Confira os 5 campos destacados abaixo.')).toBeVisible()
    await expect(page.getByText('Para criar a conta, aceite a Política de Privacidade.')).toBeVisible()
  })
})

test.describe('recuperação de senha', () => {
  test('esqueci a senha: a resposta é a mesma, exista a conta ou não', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
    await expect(page).toHaveURL(/\/esqueci-senha$/)

    // O Next 16 mantém a tela anterior montada (escondida): procure dentro do formulário desta tela
    const formulario = page.getByRole('form', { name: 'Pedir link para redefinir a senha' })
    await formulario.getByLabel('E-mail').fill('ana@poupamais.com.br')
    await formulario.getByRole('button', { name: 'Enviar link' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Confira o seu e-mail' })).toBeVisible()
    await expect(page.getByText('Se houver uma conta com esse e-mail, enviamos um link')).toBeVisible()
  })

  test('redefinir: salva a nova senha e leva ao login', async ({ page }) => {
    await page.goto('/redefinir-senha?token=token-bom')

    await page.getByLabel('Nova senha', { exact: true }).fill('123456')
    await page.getByLabel('Confirmar nova senha').fill('123456')
    await page.getByRole('button', { name: 'Salvar nova senha' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Senha nova salva. Entre com ela.')).toBeVisible()
  })

  test('redefinir com link expirado oferece pedir outro', async ({ page }) => {
    await page.goto('/redefinir-senha?token=token-expirado')

    await page.getByLabel('Nova senha', { exact: true }).fill('123456')
    await page.getByLabel('Confirmar nova senha').fill('123456')
    await page.getByRole('button', { name: 'Salvar nova senha' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Este link expirou' })).toBeVisible()
    await page.getByRole('link', { name: 'Pedir outro link' }).click()
    await expect(page).toHaveURL(/\/esqueci-senha$/)
  })
})

test('404: página que não existe oferece voltar ao início', async ({ page }) => {
  const resposta = await page.goto('/pagina-que-nao-existe')

  expect(resposta?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL(/\/$/)
})
