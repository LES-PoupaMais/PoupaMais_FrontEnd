import { expect, test } from '@playwright/test'

test('landing apresenta o PoupaMais e leva ao login', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: /Pare de perder dinheiro sem perceber\./ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible()

  await page.getByRole('link', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible()
})

test('"Começar gratuitamente" leva ao cadastro', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Começar gratuitamente' }).click()

  await expect(page).toHaveURL(/\/cadastro$/)
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
})
