import { expect, test } from '@playwright/test'

test('landing apresenta o PoupaMais e leva ao login', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: /Veja para onde vai o seu dinheiro em cada mês\./ }),
  ).toBeVisible()
  await expect(page.getByRole('figure', { name: 'Prévia do Início com dados de exemplo' })).toBeVisible()

  await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
})

test('landing → "Criar conta" leva ao cadastro', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('main').getByRole('link', { name: 'Criar conta' }).first().click()

  await expect(page).toHaveURL(/\/cadastro$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Criar conta' })).toBeVisible()
})

test('landing no celular mostra o essencial e chega à Política de privacidade', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('link', { name: 'Ler a Política de privacidade' }).click()

  await expect(page).toHaveURL(/\/privacidade$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Política de privacidade' })).toBeVisible()
})

test('as telas públicas seguem o tema do sistema', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/login')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/login')
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
})

// Revisão visual de 20/11: o topo da Privacidade no escuro passava 6px da tela a 390px
for (const largura of [360, 390]) {
  for (const tema of ['light', 'dark'] as const) {
    test(`landing e privacidade sem rolagem lateral a ${largura}px no tema ${tema}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: tema })
      await page.setViewportSize({ width: largura, height: 800 })
      for (const rota of ['/', '/privacidade']) {
        await page.goto(rota)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const larguraDaPagina = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(larguraDaPagina, rota).toBeLessThanOrEqual(largura)
      }
    })
  }
}
