import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/msw/server'
import { ErroApi, http, MENSAGEM_ERRO_PADRAO, MENSAGEM_SEM_CONEXAO } from './http'

describe('http (cliente do BFF)', () => {
  it('faz GET em /api e devolve o JSON', async () => {
    const usuario = await http.get<{ nome: string }>('/usuarios/me')

    expect(usuario.nome).toBe('Usuário Demo')
  })

  it('envia os parâmetros sem os vazios', async () => {
    let urlRecebida = ''
    server.use(
      msw.get('*/api/lancamentos', ({ request }) => {
        urlRecebida = request.url
        return HttpResponse.json([])
      }),
    )

    await http.get('/lancamentos', { params: { mes: 8, ano: 2026, tipo: undefined, descricao: '' } })

    const params = new URL(urlRecebida).searchParams
    expect(params.get('mes')).toBe('8')
    expect(params.get('ano')).toBe('2026')
    expect(params.has('tipo')).toBe(false)
    expect(params.has('descricao')).toBe(false)
  })

  it('envia o corpo como JSON', async () => {
    let corpo: unknown
    let tipo: string | null = null
    server.use(
      msw.post('*/api/categorias', async ({ request }) => {
        tipo = request.headers.get('Content-Type')
        corpo = await request.json()
        return HttpResponse.json({ id: 9, descricao: 'Pets', ativa: true }, { status: 201 })
      }),
    )

    const criada = await http.post<{ id: number }>('/categorias', { corpo: { descricao: 'Pets' } })

    expect(criada.id).toBe(9)
    expect(corpo).toEqual({ descricao: 'Pets' })
    expect(tipo).toBe('application/json')
  })

  it('envia FormData sem forçar Content-Type (o navegador põe o boundary)', async () => {
    let tipo: string | null = null
    server.use(
      msw.post('*/api/lancamentos/importar', ({ request }) => {
        tipo = request.headers.get('Content-Type')
        return HttpResponse.json({ totalLinhas: 1, importados: 1, falhas: [], categoriasCriadas: [] })
      }),
    )
    const formulario = new FormData()
    formulario.append('arquivo', new Blob(['descricao;tipo'], { type: 'text/csv' }), 'lancamentos.csv')

    await http.post('/lancamentos/importar', { corpo: formulario })

    expect(tipo).toMatch(/^multipart\/form-data; boundary=/)
  })

  it('devolve undefined em 204', async () => {
    server.use(msw.delete('*/api/lancamentos/1', () => new HttpResponse(null, { status: 204 })))

    await expect(http.delete('/lancamentos/1')).resolves.toBeUndefined()
  })

  it('devolve Blob quando a resposta não é JSON (downloads)', async () => {
    server.use(
      msw.get('*/api/lancamentos/exportar', () =>
        HttpResponse.text('descricao;tipo', { headers: { 'Content-Type': 'text/csv' } }),
      ),
    )

    const arquivo = await http.get<Blob>('/lancamentos/exportar', { params: { formato: 'csv' } })

    expect(arquivo).toBeInstanceOf(Blob)
    expect(await arquivo.text()).toBe('descricao;tipo')
  })

  it('converte o erro padrão da API em ErroApi com os erros por campo', async () => {
    server.use(
      msw.put('*/api/lancamentos/1', () =>
        HttpResponse.json(
          {
            status: 400,
            mensagem: 'Dados inválidos',
            erros: [{ campo: 'valor', mensagem: 'O valor deve ser maior que zero' }],
          },
          { status: 400 },
        ),
      ),
    )

    const erro = await http.put('/lancamentos/1', { corpo: {} }).catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro).toMatchObject({
      status: 400,
      message: 'Dados inválidos',
      erros: [{ campo: 'valor', mensagem: 'O valor deve ser maior que zero' }],
    })
  })

  it('usa a mensagem padrão quando o erro não vem no formato da API', async () => {
    server.use(msw.patch('*/api/lancamentos/1/status', () => HttpResponse.text('Bad gateway', { status: 502 })))

    const erro = await http.patch('/lancamentos/1/status', { corpo: { status: 'ATIVO' } }).catch((e: unknown) => e)

    expect(erro).toMatchObject({ status: 502, message: MENSAGEM_ERRO_PADRAO, erros: [] })
  })

  it('avisa quando não há conexão', async () => {
    server.use(msw.get('*/api/dashboard', () => HttpResponse.error()))

    const erro = await http.get('/dashboard').catch((e: unknown) => e)

    expect(erro).toMatchObject({ status: 0, message: MENSAGEM_SEM_CONEXAO })
  })
})
