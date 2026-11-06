import { http, HttpResponse } from 'msw/http'

// Handlers padrão do BFF (/api/*). Sobrescreva por teste com server.use(...).
// O "*/" no início casa com qualquer origem (o jsdom usa http://localhost:3000).
export const usuarioDemo = {
  id: 1,
  nome: 'Usuário Demo',
  email: 'demo@poupamais.com.br',
  possuiFoto: false,
  dataCadastro: '2026-08-01',
}

export const handlers = [http.get('*/api/usuarios/me', () => HttpResponse.json(usuarioDemo))]
