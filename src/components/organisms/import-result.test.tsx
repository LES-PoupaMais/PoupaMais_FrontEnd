import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ResultadoImportacao } from '@/types/api'
import { ImportResult } from './import-result'

const comFalhas: ResultadoImportacao = {
  totalLinhas: 45,
  importados: 42,
  falhas: [
    { linha: 7, conteudo: 'Farmácia;DESPESA;12/11/2026;;Saúde', motivo: 'Valor vazio.' },
    {
      linha: 12,
      conteudo: 'Padaria;DESPESA;31/02/2026;32,50;Mercado',
      motivo: 'Data inválida (31/02/2026). Use dd/mm/aaaa com um dia que exista.',
    },
    { linha: 19, conteudo: 'Freela;ENTRADA;15/11/2026;1.200,00;Trabalho', motivo: 'Tipo deve ser RECEITA ou DESPESA.' },
  ],
  categoriasCriadas: ['Pet', 'Viagem'],
}

function renderizar(resultado: ResultadoImportacao) {
  const onImportarOutro = vi.fn()
  render(
    <ImportResult
      resultado={resultado}
      nomeArquivo="lancamentos-novembro.csv"
      hrefLancamentos="/lancamentos"
      modeloHref="/api/lancamentos/template-csv"
      onImportarOutro={onImportarOutro}
    />,
  )
  return { onImportarOutro, usuario: userEvent.setup() }
}

describe('ImportResult', () => {
  it('com linhas ignoradas: resumo, tabela com linha e motivo, categorias criadas e ações', async () => {
    const { onImportarOutro, usuario } = renderizar(comFalhas)

    expect(screen.getByRole('heading', { name: 'Importação concluída' })).toBeInTheDocument()
    expect(screen.getByText('lancamentos-novembro.csv · 45 linhas lidas')).toBeInTheDocument()
    const resumo = screen.getByRole('status')
    expect(resumo).toHaveTextContent('42 lançamentos importados')
    expect(resumo).toHaveTextContent('3 linhas ignoradas')

    const tabela = screen.getByRole('table', { name: 'Linhas ignoradas' })
    const linha12 = within(tabela).getByRole('row', { name: /Linha 12/ })
    expect(linha12).toHaveTextContent('Data inválida (31/02/2026)')
    expect(linha12).toHaveTextContent('Padaria;DESPESA;31/02/2026;32,50;Mercado')
    expect(screen.getByText('Pet')).toBeInTheDocument()
    expect(screen.getByText('Viagem')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Ver lançamentos' })).toHaveAttribute('href', '/lancamentos')
    expect(screen.getByRole('link', { name: 'Baixar modelo CSV' })).toHaveAttribute(
      'href',
      '/api/lancamentos/template-csv',
    )
    await usuario.click(screen.getByRole('button', { name: 'Importar outro arquivo' }))
    expect(onImportarOutro).toHaveBeenCalledOnce()
  })

  it('só linhas inválidas: "Nada foi importado", modelo em destaque e escolher outro', () => {
    renderizar({
      ...comFalhas,
      totalLinhas: 1,
      importados: 0,
      falhas: comFalhas.falhas.slice(0, 1),
      categoriasCriadas: [],
    })

    expect(screen.getByRole('heading', { name: 'Nada foi importado' })).toBeInTheDocument()
    expect(screen.getByText('lancamentos-novembro.csv · 1 linha lida')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 lançamentos importados1 linha ignorada')
    expect(screen.getByRole('table', { name: 'Por que cada linha ficou de fora' })).toBeInTheDocument()
    expect(screen.getByText(/Nenhum lançamento foi salvo/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver lançamentos' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Escolher outro arquivo' })).toBeInTheDocument()
    expect(screen.queryByText('Categorias criadas')).toBeNull()
  })

  it('arquivo vazio: explica o cabeçalho com um exemplo', () => {
    renderizar({ totalLinhas: 0, importados: 0, falhas: [], categoriasCriadas: [] })

    expect(screen.getByRole('heading', { name: 'O arquivo está vazio' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('descricao;tipo;data;valor;categorias')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByRole('link', { name: 'Baixar modelo CSV' })).toBeInTheDocument()
  })

  it('tudo certo: só o resumo verde e Ver lançamentos', () => {
    renderizar({ totalLinhas: 1, importados: 1, falhas: [], categoriasCriadas: [] })

    expect(screen.getByRole('status')).toHaveTextContent('1 lançamento importado')
    expect(screen.queryByText(/ignorada/)).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByRole('link', { name: 'Ver lançamentos' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Baixar modelo CSV' })).toBeNull()
  })
})
