import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExportDialog, SEM_DADOS_PARA_EXPORTAR, type ExportDialogProps } from './export-dialog'

function renderizar(props: Partial<ExportDialogProps> = {}) {
  const callbacks = { onAbertoChange: vi.fn(), onFormatoChange: vi.fn(), onBaixar: vi.fn(), onMudarFiltros: vi.fn() }
  render(
    <ExportDialog
      aberto
      formato="csv"
      filtrosAtivos="Novembro 2026 · Todos os status"
      total={30}
      origem="Novembro 2026 · os que contam e os que não contam no saldo"
      {...callbacks}
      {...props}
    />,
  )
  return callbacks
}

describe('ExportDialog', () => {
  it('mostra os filtros ativos, o formato e o que vai no arquivo; baixa', async () => {
    const { onFormatoChange, onBaixar, onMudarFiltros } = renderizar()
    expect(screen.getByRole('dialog', { name: 'Exportar lançamentos' })).toBeInTheDocument()
    expect(screen.getByText('O arquivo segue os filtros ativos: Novembro 2026 · Todos os status')).toBeInTheDocument()
    expect(screen.getByText('30 lançamentos')).toBeInTheDocument()
    expect(screen.getByText(/A lixeira fica de fora/)).toBeInTheDocument()
    expect(screen.getByText(/CSV: abre em qualquer planilha/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Excel' }))
    expect(onFormatoChange).toHaveBeenCalledWith('xlsx')
    await userEvent.click(screen.getByRole('button', { name: 'Mudar filtros' }))
    expect(onMudarFiltros).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Baixar arquivo' }))
    expect(onBaixar).toHaveBeenCalled()
  })

  it('sem dados: avisa e não baixa; lixeira e Excel mudam os textos', async () => {
    const { onBaixar } = renderizar({ total: 0, lixeira: true, formato: 'xlsx' })
    expect(screen.getByText(SEM_DADOS_PARA_EXPORTAR)).toBeInTheDocument()
    expect(screen.getByText('Só os lançamentos da lixeira, de todos os meses.')).toBeInTheDocument()
    expect(screen.getByText(/Excel \(\.xlsx\)/)).toBeInTheDocument()
    const baixar = screen.getByRole('button', { name: 'Baixar arquivo' })
    expect(baixar).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(baixar)
    expect(onBaixar).not.toHaveBeenCalled()
  })

  it('sem internet: Baixar desabilitado com o motivo; Cancelar fecha', async () => {
    const { onBaixar, onAbertoChange } = renderizar({ motivoDesabilitado: 'motivo', total: 1 })
    expect(screen.getByText('1 lançamento')).toBeInTheDocument()
    const baixar = screen.getByRole('button', { name: 'Baixar arquivo' })
    expect(baixar).toHaveAccessibleDescription(/Sem internet/)
    await userEvent.click(baixar)
    expect(onBaixar).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onAbertoChange).toHaveBeenCalledWith(false)
  })
})
