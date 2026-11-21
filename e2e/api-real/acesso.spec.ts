import { emailUnico, entrarNaApi } from './apoio/api'
import { linkDeRedefinicao } from './apoio/mailpit'
import { expect, test } from './apoio/teste'

// Acesso contra a API real: cadastro, login (com senha errada), logout e "esqueci a senha" lendo o link no Mailpit.
test.use({ viewport: { width: 1280, height: 900 } })

test('cadastro → logout → login: a conta nova entra no dashboard e a sessão é o cookie httpOnly', async ({
  page,
  context,
}) => {
  const email = emailUnico('cadastro')
  await page.goto('/cadastro')
  await page.getByLabel('Nome completo').fill('Ana Souza')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('senha123')
  await page.getByLabel('Confirmar senha').fill('senha123')
  await page.getByRole('checkbox', { name: /Li e aceito/ }).click()
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('Conta criada. Este é o seu mês.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Comece pelo seu primeiro lançamento' })).toBeVisible()
  expect((await context.cookies()).find((c) => c.name === 'pm_token')).toMatchObject({ httpOnly: true })

  // Sair: apaga o cookie e volta ao login; a área logada pede login de novo
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  expect((await context.cookies()).find((c) => c.name === 'pm_token')).toBeUndefined()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?voltar=%2Fdashboard/)

  // E-mail já usado: a mensagem da API vai no campo
  await page.goto('/cadastro')
  await page.getByLabel('Nome completo').fill('Ana Souza')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill('senha123')
  await page.getByLabel('Confirmar senha').fill('senha123')
  await page.getByRole('checkbox', { name: /Li e aceito/ }).click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('Este e-mail já está cadastrado')).toBeVisible()

  // Login: senha errada → erro de credenciais; certa → volta para onde ia
  await page.goto('/login?voltar=%2Fperfil')
  const formulario = page.getByRole('form', { name: 'Entrar' })
  await formulario.getByLabel('E-mail').fill(email)
  await formulario.getByLabel('Senha', { exact: true }).fill('senha-errada')
  await formulario.getByRole('button', { name: 'Entrar' }).click()
  await expect(formulario.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

  await formulario.getByLabel('Senha', { exact: true }).fill('senha123')
  await formulario.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/perfil$/)
  await expect(page.getByRole('main').getByLabel('E-mail')).toHaveValue(email)
})

test('esqueci a senha: o link chega pelo Mailpit, redefine e só a senha nova entra', async ({ page, usuario }) => {
  await page.goto('/esqueci-senha')
  const pedido = page.getByRole('form', { name: 'Pedir link para redefinir a senha' })
  await pedido.getByLabel('E-mail').fill(usuario.email)
  await pedido.getByRole('button', { name: 'Enviar link' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Confira o seu e-mail' })).toBeVisible()

  const link = await linkDeRedefinicao(usuario.email)
  await page.goto(link)
  await page.getByLabel('Nova senha', { exact: true }).fill('nova-senha-456')
  await page.getByLabel('Confirmar nova senha').fill('nova-senha-456')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Senha nova salva. Entre com ela.')).toBeVisible()

  // O mesmo link não vale de novo (uso único)
  await page.goto(link)
  await page.getByLabel('Nova senha', { exact: true }).fill('outra-senha-789')
  await page.getByLabel('Confirmar nova senha').fill('outra-senha-789')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Este link expirou' })).toBeVisible()

  // Entra com a senha nova pela tela; a antiga não entra mais
  await expect(entrarNaApi(usuario.email, usuario.senha)).rejects.toMatchObject({ status: 401 })
  await page.goto('/login')
  const formulario = page.getByRole('form', { name: 'Entrar' })
  await formulario.getByLabel('E-mail').fill(usuario.email)
  await formulario.getByLabel('Senha', { exact: true }).fill('nova-senha-456')
  await formulario.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
})
