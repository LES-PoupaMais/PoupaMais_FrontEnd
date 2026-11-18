import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from './calendar'

const HOJE = '2026-11-18'

describe('Calendar', () => {
  it('mostra o mês da data escolhida, com hoje marcado e o escolhido selecionado', () => {
    render(<Calendar selecionado="2026-11-05" hoje={HOJE} />)

    const grade = screen.getByRole('grid', { name: 'Novembro de 2026' })
    const escolhido = within(grade).getByRole('button', { name: '5 de novembro de 2026' })
    expect(escolhido.closest('td')).toHaveAttribute('aria-selected', 'true')
    expect(escolhido).toHaveAttribute('tabindex', '0')
    expect(within(grade).getByRole('button', { name: '18 de novembro de 2026, hoje' })).toHaveAttribute(
      'aria-current',
      'date',
    )
    expect(within(grade).getAllByRole('columnheader')).toHaveLength(7)
    expect(screen.getByText('Escolhida: 05/11/2026')).toBeInTheDocument()
  })

  it('sem data escolhida, abre no mês de hoje e escolhe um dia ao clicar', async () => {
    const aoSelecionar = vi.fn()
    render(<Calendar selecionado={null} hoje={HOJE} onSelecionar={aoSelecionar} />)

    await userEvent.click(screen.getByRole('button', { name: '20 de novembro de 2026' }))

    expect(aoSelecionar).toHaveBeenCalledWith('2026-11-20')
  })

  it('navega entre meses pelas setas do cabeçalho', async () => {
    render(<Calendar selecionado="2026-12-10" hoje={HOJE} />)

    await userEvent.click(screen.getByRole('button', { name: 'Próximo mês' }))
    expect(screen.getByRole('grid', { name: 'Janeiro de 2027' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(screen.getByRole('grid', { name: 'Novembro de 2026' })).toBeInTheDocument()
  })

  it('segue o fluxo ano → mês → dia', async () => {
    const aoSelecionar = vi.fn()
    render(<Calendar selecionado="2026-11-18" hoje={HOJE} onSelecionar={aoSelecionar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Escolher ano, 2026' }))
    const anos = screen.getByRole('group', { name: 'Anos' })
    expect(screen.getByText('2020 – 2031')).toBeInTheDocument()
    expect(within(anos).getByRole('button', { name: '2026' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(anos).getByRole('button', { name: '2026' })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: 'Próximos anos' }))
    expect(screen.getByText('2032 – 2043')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Anos anteriores' }))
    await userEvent.click(screen.getByRole('button', { name: 'Anos anteriores' }))
    await userEvent.click(screen.getByRole('button', { name: '2015' }))

    const meses = screen.getByRole('group', { name: 'Meses de 2015' })
    expect(within(meses).getAllByRole('button')).toHaveLength(12)
    await userEvent.click(screen.getByRole('button', { name: 'Próximo ano' }))
    await userEvent.click(screen.getByRole('button', { name: 'Ano anterior' }))
    await userEvent.click(within(meses).getByRole('button', { name: 'março de 2015' }))

    expect(screen.getByRole('grid', { name: 'Março de 2015' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '9 de março de 2015' }))
    expect(aoSelecionar).toHaveBeenCalledWith('2015-03-09')
  })

  it('abre a visão de meses pelo nome do mês, com o mês escolhido pressionado', async () => {
    render(<Calendar selecionado="2026-11-18" hoje={HOJE} />)

    await userEvent.click(screen.getByRole('button', { name: 'Escolher mês, novembro' }))

    const novembro = screen.getByRole('button', { name: 'novembro de 2026' })
    expect(novembro).toHaveAttribute('aria-pressed', 'true')
    expect(novembro).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Escolher ano, 2026' }))
    expect(screen.getByRole('group', { name: 'Anos' })).toBeInTheDocument()
  })

  it('anda pelo teclado: setas, PageUp/PageDown e Home/End', async () => {
    render(<Calendar selecionado="2026-11-18" hoje={HOJE} focarAoAbrir />)
    const dia = (nome: string) => screen.getByRole('button', { name: nome })

    expect(dia('18 de novembro de 2026, hoje')).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(dia('19 de novembro de 2026')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(dia('26 de novembro de 2026')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}')
    expect(dia('18 de novembro de 2026, hoje')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(dia('15 de novembro de 2026')).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(dia('21 de novembro de 2026')).toHaveFocus()
    await userEvent.keyboard('{PageDown}')
    expect(dia('21 de dezembro de 2026')).toHaveFocus()
    await userEvent.keyboard('{PageUp}{PageUp}')
    expect(dia('21 de outubro de 2026')).toHaveFocus()
    await userEvent.keyboard('a')
    expect(dia('21 de outubro de 2026')).toHaveFocus()
  })

  it('respeita os limites: não passa de 01/01/2000 nem de 31/12/2100', async () => {
    const { unmount } = render(<Calendar selecionado="2000-01-01" hoje={HOJE} focarAoAbrir />)

    expect(screen.getByRole('button', { name: 'Mês anterior' })).toBeDisabled()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: '1 de janeiro de 2000' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Escolher ano, 2000' }))
    expect(screen.getByRole('button', { name: 'Anos anteriores' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '1999' })).toBeDisabled()
    unmount()

    render(<Calendar selecionado="2100-12-31" hoje={HOJE} />)
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Escolher mês, dezembro' }))
    expect(screen.getByRole('button', { name: 'Próximo ano' })).toBeDisabled()
  })

  it('desabilita dias fora de um limite próprio', () => {
    render(<Calendar selecionado={null} hoje={HOJE} min="2026-11-10" max="2026-11-20" />)

    expect(screen.getByRole('button', { name: '9 de novembro de 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '21 de novembro de 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '10 de novembro de 2026' })).toBeEnabled()
  })

  it('o atalho Hoje escolhe a data de hoje', async () => {
    const aoSelecionar = vi.fn()
    render(<Calendar selecionado="2015-03-09" hoje={HOJE} onSelecionar={aoSelecionar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }))

    expect(aoSelecionar).toHaveBeenCalledWith(HOJE)
    expect(screen.getByRole('grid', { name: 'Novembro de 2026' })).toBeInTheDocument()
  })

  it('no modo mês, abre em meses e devolve só mês e ano', async () => {
    const aoSelecionarMes = vi.fn()
    render(<Calendar modo="mes" selecionado="2026-11-01" hoje={HOJE} onSelecionarMes={aoSelecionarMes} />)

    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'agosto de 2026' }))
    expect(aoSelecionarMes).toHaveBeenCalledWith(8, 2026)

    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(aoSelecionarMes).toHaveBeenLastCalledWith(11, 2026)
    expect(screen.queryByText(/Escolhida/)).not.toBeInTheDocument()
  })

  it('em outro ano sem escolha, o foco da visão de meses vai para janeiro', async () => {
    render(<Calendar selecionado={null} hoje="2026-11-18" />)

    await userEvent.click(screen.getByRole('button', { name: 'Escolher ano, 2026' }))
    await userEvent.click(screen.getByRole('button', { name: '2027' }))

    expect(screen.getByRole('button', { name: 'janeiro de 2027' })).toHaveFocus()
  })
})
