import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'

vi.mock('server-only', () => ({}))

const { chamarApiDoServidor } = await import('./api-servidor')

describe('chamarApiDoServidor (Server Actions → API)', () => {
  it('envia JSON com o token e devolve os dados', async () => {
    let autorizacao: string | null = null
    let corpo: unknown
    server.use(
      msw.post('http://localhost:8080/api/auth/login', async ({ request }) => {
        autorizacao = request.headers.get('Authorization')
        corpo = await request.json()
        return HttpResponse.json({ token: 'jwt' })
      }),
    )

    const resposta = await chamarApiDoServidor('POST', '/auth/login', { corpo: { email: 'a@b.com' }, token: 't' })

    expect(resposta).toEqual({ ok: true, status: 200, dados: { token: 'jwt' } })
    expect(autorizacao).toBe('Bearer t')
    expect(corpo).toEqual({ email: 'a@b.com' })
  })

  it('erro da API: devolve status, a mensagem e os erros[] válidos', async () => {
    server.use(
      msw.post('*/api/auth/cadastro', () =>
        HttpResponse.json(
          {
            status: 400,
            codigo: 'VALIDACAO',
            mensagem: 'Dados inválidos',
            erros: [{ campo: 'email', mensagem: 'x' }, { foo: 1 }],
          },
          { status: 400 },
        ),
      ),
    )

    const resposta = await chamarApiDoServidor('POST', '/auth/cadastro', { corpo: {} })

    expect(resposta).toEqual({
      ok: false,
      status: 400,
      mensagem: 'Dados inválidos',
      erros: [{ campo: 'email', mensagem: 'x' }],
      codigo: 'VALIDACAO',
    })
  })

  it('erro sem corpo e resposta 204 sem JSON', async () => {
    server.use(
      msw.post('*/api/x', () => new HttpResponse(null, { status: 500 })),
      msw.post('*/api/y', () => new HttpResponse(null, { status: 204 })),
    )

    expect(await chamarApiDoServidor('POST', '/x')).toEqual({ ok: false, status: 500, mensagem: null, erros: [] })
    expect(await chamarApiDoServidor('POST', '/y')).toEqual({ ok: true, status: 204, dados: undefined })
  })

  it('sem conexão vira status 0', async () => {
    server.use(msw.get('*/api/z', () => HttpResponse.error()))

    expect(await chamarApiDoServidor('GET', '/z')).toEqual({ ok: false, status: 0, mensagem: null, erros: [] })
  })
})
