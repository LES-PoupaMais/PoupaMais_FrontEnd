import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { http } from '@/lib/http'
import { server } from '@/test/msw/server'
import { categoriasService } from './categorias.service'
import { dashboardService } from './dashboard.service'
import { lancamentosService, TAMANHO_PAGINA } from './lancamentos.service'
import { usuarioService } from './usuario.service'

type Capturada = { metodo: string; url: URL; corpo: unknown }

/** Responde `resposta` e guarda a última requisição recebida em `caminho` */
function capturar(metodo: 'get' | 'post' | 'put' | 'patch' | 'delete', caminho: string, resposta: unknown = {}) {
  const capturada: { atual?: Capturada } = {}
  server.use(
    msw[metodo](`*/api${caminho}`, async ({ request }) => {
      const tipo = request.headers.get('content-type') ?? ''
      const corpo = tipo.includes('application/json') ? await request.json() : null
      capturada.atual = { metodo: request.method, url: new URL(request.url), corpo }
      return resposta === null ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(resposta)
    }),
  )
  return capturada
}

describe('lancamentosService', () => {
  it('lista paginado: página 0 e tamanho 12 por padrão, com os filtros', async () => {
    const r = capturar('get', '/lancamentos', { itens: [], pagina: 0, tamanho: 12, total: 0, totalPaginas: 0 })

    const pagina = await lancamentosService.listar({ mes: 11, ano: 2026, status: 'DELETADO' })

    expect(pagina.total).toBe(0)
    expect(Object.fromEntries(r.atual!.url.searchParams)).toEqual({
      mes: '11',
      ano: '2026',
      status: 'DELETADO',
      pagina: '0',
      tamanho: String(TAMANHO_PAGINA),
    })
  })

  it('cria e edita com a data ISO no corpo', async () => {
    const dados = { descricao: 'Salário', tipo: 'RECEITA' as const, data: '2026-11-05', valor: 9800, categoriaIds: [3] }
    const criar = capturar('post', '/lancamentos', { id: 9 })
    await lancamentosService.criar(dados)
    expect(criar.atual!.corpo).toEqual(dados)

    const editar = capturar('put', '/lancamentos/9', { id: 9 })
    await lancamentosService.atualizar(9, dados)
    expect(editar.atual!.corpo).toEqual(dados)
  })

  it('busca, muda "Conta no saldo", move para a lixeira e restaura', async () => {
    capturar('get', '/lancamentos/3', { id: 3 })
    expect(await lancamentosService.buscar(3)).toEqual({ id: 3 })

    const status = capturar('patch', '/lancamentos/3/status', { id: 3 })
    await lancamentosService.alterarStatus(3, 'INATIVO')
    expect(status.atual!.corpo).toEqual({ status: 'INATIVO' })

    const lixeira = capturar('delete', '/lancamentos/3', null)
    await lancamentosService.moverParaLixeira(3)
    expect(lixeira.atual!.metodo).toBe('DELETE')

    const restaurar = capturar('post', '/lancamentos/3/restaurar', { id: 3, status: 'INATIVO' })
    expect(await lancamentosService.restaurar(3)).toEqual({ id: 3, status: 'INATIVO' })
    expect(restaurar.atual!.metodo).toBe('POST')
  })

  // Multipart: o MSW no jsdom não consegue ler o corpo (Node 26 fecha o stream); conferimos o que vai para o http.
  it('importa o CSV no campo "arquivo"', async () => {
    const post = vi.spyOn(http, 'post').mockResolvedValue({ importados: 1 })

    await lancamentosService.importar(new File(['descricao;tipo;data;valor;categorias'], 'lancamentos.csv'))

    expect(post).toHaveBeenCalledWith('/lancamentos/importar', { corpo: expect.any(FormData) })
    expect((post.mock.calls[0][1]?.corpo as FormData).get('arquivo')).toBeInstanceOf(File)
    post.mockRestore()
  })

  it('exporta com o formato e os filtros e baixa o modelo CSV', async () => {
    let url = new URL('http://x')
    server.use(
      msw.get('*/api/lancamentos/exportar', ({ request }) => {
        url = new URL(request.url)
        return new HttpResponse('csv', { headers: { 'Content-Disposition': 'attachment; filename="lancamentos.csv"' } })
      }),
      msw.get('*/api/lancamentos/template-csv', () => new HttpResponse('modelo')),
    )

    expect((await lancamentosService.exportar('xlsx', { mes: 11, tipo: 'DESPESA' })).nomeArquivo).toBe(
      'lancamentos.csv',
    )
    expect(Object.fromEntries(url.searchParams)).toEqual({ formato: 'xlsx', mes: '11', tipo: 'DESPESA' })
    expect(await (await lancamentosService.baixarModeloCsv()).blob.text()).toBe('modelo')
  })
})

describe('categoriasService', () => {
  it('lista com o mês da contagem e faz criar, renomear, ativar e excluir', async () => {
    const listar = capturar('get', '/categorias', [])
    await categoriasService.listar({ mes: 11, ano: 2026 })
    expect(Object.fromEntries(listar.atual!.url.searchParams)).toEqual({ mes: '11', ano: '2026' })

    const criar = capturar('post', '/categorias', { id: 7 })
    await categoriasService.criar({ descricao: 'Pet' })
    expect(criar.atual!.corpo).toEqual({ descricao: 'Pet' })

    const renomear = capturar('put', '/categorias/7', { id: 7 })
    await categoriasService.atualizar(7, { descricao: 'Pets' })
    expect(renomear.atual!.corpo).toEqual({ descricao: 'Pets' })

    const status = capturar('patch', '/categorias/7/status', { id: 7 })
    await categoriasService.alterarStatus(7, false)
    expect(status.atual!.corpo).toEqual({ ativa: false })

    const excluir = capturar('delete', '/categorias/7', null)
    await categoriasService.excluir(7)
    expect(excluir.atual!.metodo).toBe('DELETE')
  })
})

describe('dashboardService e usuarioService', () => {
  it('pede o dashboard do mês', async () => {
    const r = capturar('get', '/dashboard', { mes: 11 })
    await dashboardService.obter({ mes: 11, ano: 2026 })
    expect(Object.fromEntries(r.atual!.url.searchParams)).toEqual({ mes: '11', ano: '2026' })
  })

  it('lê e atualiza o perfil, troca e remove a foto e baixa os dados', async () => {
    expect((await usuarioService.obter()).nome).toBe('Usuário Demo')

    const atualizar = capturar('put', '/usuarios/me', { nome: 'Novo' })
    await usuarioService.atualizar({ nome: 'Novo' })
    expect(atualizar.atual!.corpo).toEqual({ nome: 'Novo' })

    const put = vi.spyOn(http, 'put').mockResolvedValue(undefined)
    await usuarioService.trocarFoto(new File(['x'], 'foto.png', { type: 'image/png' }))
    expect(put).toHaveBeenCalledWith('/usuarios/me/foto', { corpo: expect.any(FormData) })
    expect((put.mock.calls[0][1]?.corpo as FormData).get('foto')).toBeInstanceOf(File)
    put.mockRestore()

    const remover = capturar('delete', '/usuarios/me/foto', null)
    await usuarioService.removerFoto()
    expect(remover.atual!.metodo).toBe('DELETE')

    expect(usuarioService.urlDaFoto(3)).toBe('/api/usuarios/me/foto?v=3')

    server.use(
      msw.get('*/api/usuarios/me/dados', () =>
        HttpResponse.json(
          {},
          { headers: { 'Content-Disposition': 'attachment; filename="meus-dados-poupamais.json"' } },
        ),
      ),
    )
    expect((await usuarioService.baixarDados()).nomeArquivo).toBe('meus-dados-poupamais.json')
  })
})
