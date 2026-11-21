import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { categoriasDemo } from '@/test/msw/server-e-dados'
import { FILTROS_VAZIOS, FilterBar, contarFiltrosAtivos, temFiltro, type FilterBarProps } from './filter-bar'

// O Select e o menu do Radix usam APIs de ponteiro e de medida que o jsdom não tem
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.scrollIntoView = () => {}
})

function renderizar(props: Partial<FilterBarProps> = {}) {
  const callbacks = {
    onMudarMes: vi.fn(),
    onChange: vi.fn(),
    onLimpar: vi.fn(),
    onIrParaLixeira: vi.fn(),
    onExportar: vi.fn(),
    onBaixarModelo: vi.fn(),
    onBuscaChange: vi.fn(),
  }
  render(
    <FilterBar
      filtros={FILTROS_VAZIOS}
      busca=""
      categorias={categoriasDemo}
      periodo={{ mes: 11, ano: 2026 }}
      total={30}
      hrefImportar="/lancamentos/importar"
      {...callbacks}
      {...props}
    />,
  )
  const [barra, celular] = screen.getAllByRole('search', { name: 'Filtrar lançamentos' })
  return { ...callbacks, barra, celular }
}

describe('FilterBar', () => {
  it('barra: total, status, mês e exportar; sem filtro não mostra Limpar', async () => {
    const { barra, onChange, onIrParaLixeira, onMudarMes, onExportar } = renderizar()
    expect(within(barra).getByRole('status')).toHaveTextContent('30 lançamentos')
    expect(within(barra).queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()

    await userEvent.click(within(barra).getByRole('radio', { name: 'Inativos' }))
    expect(onChange).toHaveBeenCalledWith({ status: 'INATIVO' })
    await userEvent.click(within(barra).getByRole('radio', { name: 'Lixeira' }))
    expect(onIrParaLixeira).toHaveBeenCalled()
    await userEvent.click(within(barra).getByRole('button', { name: 'Próximo mês' }))
    expect(onMudarMes).toHaveBeenCalledWith({ mes: 12, ano: 2026 })
    await userEvent.click(within(barra).getByRole('button', { name: 'Exportar' }))
    expect(onExportar).toHaveBeenCalled()
  })

  it('tipo e categoria pelos selects', async () => {
    const { barra, onChange } = renderizar()
    await userEvent.click(within(barra).getByRole('combobox', { name: 'Tipo' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Despesa' }))
    expect(onChange).toHaveBeenCalledWith({ tipo: 'DESPESA' })
    await userEvent.click(within(barra).getByRole('combobox', { name: 'Categoria' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Mercado' }))
    expect(onChange).toHaveBeenCalledWith({ categoriaId: 2 })
  })

  it('a busca mostra o texto recebido e devolve cada tecla por onBuscaChange (a espera é da tela)', () => {
    const { barra, onBuscaChange, onChange } = renderizar({ busca: 'mer' })
    const campo = within(barra).getByLabelText('Buscar')
    expect(campo).toHaveValue('mer')
    fireEvent.change(campo, { target: { value: 'merc' } })
    expect(onBuscaChange).toHaveBeenCalledWith('merc')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('com filtro: Limpar filtros na barra e chips removíveis no celular', async () => {
    const { barra, celular, onLimpar, onChange } = renderizar({
      filtros: { q: 'feira', tipo: 'DESPESA', status: 'ATIVO', categoriaId: 2 },
      total: 1,
    })
    expect(within(barra).getByRole('status')).toHaveTextContent('1 lançamento')
    await userEvent.click(within(barra).getByRole('button', { name: 'Limpar filtros' }))
    expect(onLimpar).toHaveBeenCalled()

    expect(within(celular).getByRole('button', { name: 'Filtros, 3 ativos' })).toBeInTheDocument()
    await userEvent.click(within(celular).getByRole('button', { name: 'Remover filtro Tipo: Despesa' }))
    expect(onChange).toHaveBeenCalledWith({ tipo: null })
    await userEvent.click(within(celular).getByRole('button', { name: 'Remover filtro Status: Ativos' }))
    expect(onChange).toHaveBeenCalledWith({ status: null })
    await userEvent.click(within(celular).getByRole('button', { name: 'Remover filtro Categoria: Mercado' }))
    expect(onChange).toHaveBeenCalledWith({ categoriaId: null })
    await userEvent.click(within(celular).getByRole('button', { name: 'Remover busca' }))
    expect(onChange).toHaveBeenCalledWith({ q: '' })
  })

  it('celular: a folha aplica tipo, status e categoria de uma vez; Lixeira leva para a Lixeira', async () => {
    const { celular, onChange, onIrParaLixeira } = renderizar({ total: null })
    expect(within(celular).getByRole('status')).toHaveTextContent('Carregando…')
    await userEvent.click(within(celular).getByRole('button', { name: 'Filtros' }))
    const folha = screen.getByRole('dialog', { name: 'Filtros' })
    await userEvent.click(within(folha).getByRole('radio', { name: 'Despesa' }))
    await userEvent.click(within(folha).getByRole('radio', { name: 'Ativos' }))
    await userEvent.click(within(folha).getByRole('button', { name: 'Mercado' }))
    await userEvent.click(within(folha).getByRole('button', { name: 'Aplicar filtros' }))
    expect(onChange).toHaveBeenCalledWith({ tipo: 'DESPESA', status: 'ATIVO', categoriaId: 2 })

    await userEvent.click(within(celular).getByRole('button', { name: 'Filtros' }))
    const deNovo = screen.getByRole('dialog', { name: 'Filtros' })
    await userEvent.click(within(deNovo).getByRole('button', { name: 'Limpar' }))
    await userEvent.click(within(deNovo).getByRole('radio', { name: 'Lixeira' }))
    expect(onIrParaLixeira).toHaveBeenCalled()
  })

  it('celular: o ícone de busca abre o campo; Importar tem o menu', async () => {
    const { celular, onBaixarModelo } = renderizar()
    await userEvent.click(within(celular).getByRole('button', { name: 'Buscar lançamentos' }))
    expect(within(celular).getByLabelText('Buscar')).toBeInTheDocument()
    await userEvent.click(within(celular).getByRole('button', { name: 'Importar' }))
    expect(await screen.findByRole('menuitem', { name: 'Importar arquivo' })).toHaveAttribute(
      'href',
      '/lancamentos/importar',
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Baixar modelo CSV' }))
    expect(onBaixarModelo).toHaveBeenCalled()
  })

  it('contarFiltrosAtivos e temFiltro', () => {
    expect(contarFiltrosAtivos(FILTROS_VAZIOS)).toBe(0)
    expect(temFiltro({ ...FILTROS_VAZIOS, q: ' ' })).toBe(false)
    expect(temFiltro({ ...FILTROS_VAZIOS, q: 'x' })).toBe(true)
  })
})
