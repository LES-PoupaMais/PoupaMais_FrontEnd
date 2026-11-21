import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from '@/components/atoms/sonner'
import { lancamentosService } from '@/services/lancamentos.service'
import { server } from '@/test/msw/server'
import { renderComProviders } from '@/test/utils'
import type { ResultadoImportacao } from '@/types/api'
import { ImportarProvider, useImportarContext } from './ImportarContext'
import { ImportarView } from './ImportarView'

const { salvarArquivo } = vi.hoisted(() => ({ salvarArquivo: vi.fn() }))
vi.mock('@/lib/baixar-arquivo', () => ({ salvarArquivo }))

const csv = (nome = 'lancamentos-novembro.csv', bytes = 2048) =>
  new File([new Uint8Array(bytes)], nome, { type: 'text/csv' })

const resultado: ResultadoImportacao = {
  totalLinhas: 3,
  importados: 2,
  falhas: [
    {
      linha: 3,
      conteudo: 'Padaria;DESPESA;31/02/2026;32,50;Mercado',
      motivo: 'Data inválida (31/02/2026). Use dd/mm/aaaa com um dia que exista.',
    },
  ],
  categoriasCriadas: ['Pet'],
}

function renderizar() {
  return renderComProviders(
    <>
      <ImportarProvider>
        <ImportarView />
      </ImportarProvider>
      <Toaster />
    </>,
  )
}

const botaoImportar = () => screen.getByRole('button', { name: /Importar lançamentos|Importando/ })

describe('Importar CSV (Context + View)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    salvarArquivo.mockClear()
  })

  it('começa sem arquivo: Importar desabilitado com o motivo e o modelo para baixar', async () => {
    server.use(
      http.get(
        '*/api/lancamentos/template-csv',
        () => new HttpResponse('x', { headers: { 'Content-Type': 'text/csv' } }),
      ),
    )
    const { usuario } = renderizar()

    expect(botaoImportar()).toBeDisabled()
    expect(botaoImportar()).toHaveAccessibleDescription('Escolha um arquivo para continuar.')
    expect(document.getElementById('modelo-csv')).not.toBeNull()
    // Mesmo download da lista (useBaixarModeloCsv): nome do Content-Disposition e toast
    await usuario.click(screen.getAllByRole('button', { name: 'Baixar modelo CSV' })[0])
    expect(await screen.findByText('Modelo CSV baixado')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Colunas, nesta ordem' })).toBeInTheDocument()
  })

  it('recusa arquivo acima de 2 MB antes de enviar (RN012)', async () => {
    const importar = vi.fn()
    server.use(http.post('*/api/lancamentos/importar', importar))
    const { usuario } = renderizar()

    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv('grande.csv', 3 * 1024 * 1024))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'O arquivo tem 3 MB. O limite é 2 MB: divida em arquivos menores.',
    )
    expect(botaoImportar()).toBeDisabled()
    expect(importar).not.toHaveBeenCalled()
  })

  it('importa, mostra o resultado com a linha inválida e o toast; "Importar outro arquivo" volta', async () => {
    server.use(http.post('*/api/lancamentos/importar', () => HttpResponse.json(resultado)))
    const { usuario } = renderizar()

    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    expect(screen.getByText('lancamentos-novembro.csv')).toBeInTheDocument()
    await usuario.click(botaoImportar())

    expect(await screen.findByRole('heading', { name: 'Importação concluída' })).toBeInTheDocument()
    expect(
      screen.getByText(/Importado em \d{2}\/\d{2}\/\d{4} a partir de lancamentos-novembro.csv/),
    ).toBeInTheDocument()
    const tabela = screen.getByRole('table', { name: 'Linhas ignoradas' })
    expect(within(tabela).getByText('Linha 3')).toBeInTheDocument()
    expect(await screen.findByText('2 lançamentos importados. 1 linha ignorada.')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Importar outro arquivo' }))
    expect(screen.getByText('Arraste o arquivo CSV para cá')).toBeInTheDocument()
  })

  it('"Baixar linhas ignoradas (.csv)": cabeçalho do modelo + linhas originais, com BOM e \\r\\n, e o toast', async () => {
    const falhas = [
      { linha: 3, conteudo: '"Padaria; pão";DESPESA;31/02/2026;32,50;Mercado', motivo: 'Data inválida (31/02/2026).' },
      { linha: 5, conteudo: 'Farmácia;DESPESA;12/11/2026;;Saúde', motivo: 'Valor vazio.' },
    ]
    server.use(http.post('*/api/lancamentos/importar', () => HttpResponse.json({ ...resultado, falhas })))
    const { usuario } = renderizar()
    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    await usuario.click(botaoImportar())

    await usuario.click(await screen.findByRole('button', { name: 'Baixar linhas ignoradas (.csv)' }))

    expect(salvarArquivo).toHaveBeenCalledOnce()
    const [blob, nome] = salvarArquivo.mock.calls[0] as [Blob, string]
    expect(nome).toMatch(/^linhas-ignoradas-\d{4}-\d{2}-\d{2}\.csv$/)
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)).toBe(
      '\uFEFFdescricao;tipo;data;valor;categorias\r\n' +
        '"Padaria; pão";DESPESA;31/02/2026;32,50;Mercado\r\n' +
        'Farmácia;DESPESA;12/11/2026;;Saúde\r\n',
    )
    expect(await screen.findByText('Linhas ignoradas baixadas')).toBeInTheDocument()
  })

  it('mostra "Importando…" enquanto envia', async () => {
    // O MSW no jsdom não segura um upload multipart pendente: o service é controlado direto
    let liberar: (r: ResultadoImportacao) => void = () => {}
    vi.spyOn(lancamentosService, 'importar').mockImplementation(
      () => new Promise<ResultadoImportacao>((r) => (liberar = r)),
    )
    const { usuario } = renderizar()
    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    await usuario.click(botaoImportar())

    expect(await screen.findByText('Importando lancamentos-novembro.csv')).toBeInTheDocument()
    expect(botaoImportar()).toHaveAttribute('aria-busy', 'true')
    liberar({ ...resultado, falhas: [] })
    expect(await screen.findByText('2 lançamentos importados.')).toBeInTheDocument()
  })

  it('arquivo recusado pela API: o erro aparece na área de envio', async () => {
    server.use(
      http.post('*/api/lancamentos/importar', () =>
        HttpResponse.json({ status: 400, mensagem: 'O arquivo passa de 5.000 linhas.' }, { status: 400 }),
      ),
    )
    const { usuario } = renderizar()
    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    await usuario.click(botaoImportar())

    expect(await screen.findByRole('alert')).toHaveTextContent('O arquivo passa de 5.000 linhas.')
    expect(botaoImportar()).toBeDisabled()
  })

  it('sem resposta do servidor: toast e o arquivo continua escolhido', async () => {
    server.use(http.post('*/api/lancamentos/importar', () => HttpResponse.error()))
    const { usuario } = renderizar()
    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    await usuario.click(botaoImportar())

    expect((await screen.findAllByText(/Não foi possível conectar ao servidor/))[0]).toBeInTheDocument()
    expect(screen.getByText('lancamentos-novembro.csv')).toBeInTheDocument()
  })

  it('remover o arquivo volta ao início', async () => {
    const { usuario } = renderizar()
    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    await usuario.click(screen.getByRole('button', { name: 'Remover arquivo lancamentos-novembro.csv' }))

    expect(botaoImportar()).toBeDisabled()
  })

  it('sem conexão: aviso e Importar não envia', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const importar = vi.fn()
    server.use(http.post('*/api/lancamentos/importar', importar))
    const { usuario } = renderizar()

    // A faixa "Sem internet agora…" fica no topo da casca (AppShell); a tela só bloqueia o que grava
    expect(screen.queryByText(/Sem internet agora/)).not.toBeInTheDocument()
    await usuario.upload(screen.getByLabelText('Escolher arquivo'), csv())
    await usuario.click(botaoImportar())

    expect(botaoImportar()).toHaveAttribute('aria-disabled', 'true')
    expect(importar).not.toHaveBeenCalled()
  })

  it('useImportarContext fora do Provider dá erro claro', () => {
    function SemProvider() {
      useImportarContext()
      return null
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderComProviders(<SemProvider />)).toThrow(/dentro de <ImportarProvider>/)
  })
})
