import type { Page } from '@playwright/test'

export const usuarioDemo = {
  id: 1,
  nome: 'Usuário Demo',
  email: 'demo@poupamais.com.br',
  possuiFoto: false,
  dataCadastro: '2026-08-01',
}

// Simula o BFF no navegador. Cada spec acrescenta as rotas que usa (page.route) antes de navegar.
export async function simularApiBasica(page: Page): Promise<void> {
  await page.route('**/api/usuarios/me', (rota) => rota.fulfill({ json: usuarioDemo }))
}
