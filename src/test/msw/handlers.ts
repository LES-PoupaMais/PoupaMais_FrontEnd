import { http, HttpResponse } from 'msw/http'
import { categoriasDemo, dashboardDemo, lancamentosDemo, paginar, usuarioDemo } from './dados'

export { categoriasDemo, dashboardDemo, lancamentosDemo, usuarioDemo } from './dados'

// Handlers padrão do BFF (/api/*), no contrato v1.1.0. Sobrescreva por teste com server.use(...).
// O "*/" no início casa com qualquer origem (o jsdom usa http://localhost:3000).
const numero = (valor: string | null, padrao: number) => (valor === null ? padrao : Number(valor))

export const handlers = [
  http.get('*/api/usuarios/me', () => HttpResponse.json(usuarioDemo)),

  http.get('*/api/categorias', () => HttpResponse.json(categoriasDemo)),

  http.get('*/api/lancamentos', ({ request }) => {
    const params = new URL(request.url).searchParams
    const status = params.get('status')
    const itens = lancamentosDemo.filter((l) => (status ? l.status === status : l.status !== 'DELETADO'))
    return HttpResponse.json(paginar(itens, numero(params.get('pagina'), 0), numero(params.get('tamanho'), 12)))
  }),

  http.get('*/api/lancamentos/:id', ({ params }) => {
    const encontrado = lancamentosDemo.find((l) => l.id === Number(params.id))
    return encontrado
      ? HttpResponse.json(encontrado)
      : HttpResponse.json({ status: 404, mensagem: 'Lançamento não encontrado' }, { status: 404 })
  }),

  http.get('*/api/dashboard', ({ request }) => {
    const params = new URL(request.url).searchParams
    return HttpResponse.json({
      ...dashboardDemo,
      mes: numero(params.get('mes'), 11),
      ano: numero(params.get('ano'), 2026),
    })
  }),
]
