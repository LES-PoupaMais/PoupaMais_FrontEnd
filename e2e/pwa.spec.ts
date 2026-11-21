import { expect, test } from '@playwright/test'

// PWA no build de produção: manifest, ícones e service worker registrado (CLAUDE.md, seção "PWA")
test.use({ serviceWorkers: 'allow' })

test('o manifest responde com nome, início e ícones, e os ícones respondem', async ({ request }) => {
  const resposta = await request.get('/manifest.webmanifest')
  expect(resposta.ok()).toBe(true)

  const manifest = await resposta.json()
  expect(manifest).toMatchObject({
    name: 'PoupaMais',
    short_name: 'PoupaMais',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    lang: 'pt-BR',
  })
  const icones: { src: string; sizes: string; purpose?: string }[] = manifest.icons
  expect(icones.map((icone) => `${icone.sizes} ${icone.purpose}`)).toEqual([
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ])

  for (const icone of icones) {
    const imagem = await request.get(icone.src)
    expect(imagem.status(), icone.src).toBe(200)
    expect(imagem.headers()['content-type']).toBe('image/png')
  }
})

test('a página aponta o manifest e as cores do tema, e o service worker registra', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2)

  const escopo = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
  expect(escopo).toBe(new URL('/', page.url()).href)
})
