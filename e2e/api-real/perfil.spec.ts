import { chamarApi, entrarNaApi } from './apoio/api'
import { expect, test } from './apoio/teste'

// Perfil contra a API real: alterar o nome (BFF) e a senha (Server Action que troca o cookie da sessão).
test.use({ viewport: { width: 1280, height: 900 } })

test('altera o nome e a senha; a sessão continua com o token novo', async ({ page, context, logado }) => {
  await page.goto('/perfil')
  const principal = page.getByRole('main')
  await expect(principal.getByLabel('E-mail')).toHaveValue(logado.email)

  await principal.getByLabel('Nome', { exact: true }).fill('Leonardo Nascimento')
  await page.getByRole('button', { name: 'Salvar nome' }).click()
  await expect(page.getByText('Nome salvo')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Avatar de Leonardo Nascimento' }).first()).toBeVisible()
  expect((await chamarApi<{ nome: string }>('GET', 'usuarios/me', { token: logado.token })).dados.nome).toBe(
    'Leonardo Nascimento',
  )

  const tokenAntes = (await context.cookies()).find((c) => c.name === 'pm_token')?.value
  const trocar = async (atual: string) => {
    await principal.getByLabel('Senha atual').fill(atual)
    await principal.getByLabel('Nova senha', { exact: true }).fill('poupa2026')
    await principal.getByLabel('Confirmar nova senha').fill('poupa2026')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
  }

  // Senha atual errada: a mensagem da API, sem trocar a sessão
  await trocar('senha-errada')
  await expect(page.getByText('A senha atual está incorreta', { exact: true })).toBeVisible()
  expect((await context.cookies()).find((c) => c.name === 'pm_token')?.value).toBe(tokenAntes)

  await trocar(logado.senha)
  await expect(page.getByText('Senha alterada')).toBeVisible()
  await expect(principal.getByLabel('Senha atual')).toHaveValue('')
  const cookie = (await context.cookies()).find((c) => c.name === 'pm_token')
  expect(cookie?.value).not.toBe(tokenAntes)
  expect(cookie?.httpOnly).toBe(true)

  // A sessão do navegador segue válida (token novo) e só a senha nova entra
  await page.reload()
  await expect(principal.getByLabel('Nome', { exact: true })).toHaveValue('Leonardo Nascimento')
  await expect(entrarNaApi(logado.email, logado.senha)).rejects.toMatchObject({ status: 401 })
  await expect(entrarNaApi(logado.email, 'poupa2026')).resolves.toMatchObject({ nome: 'Leonardo Nascimento' })
})
