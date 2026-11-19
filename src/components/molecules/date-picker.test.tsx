import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker, type DatePickerProps } from './date-picker'

const HOJE = '2026-11-18'

function Controlado(props: Partial<DatePickerProps> & { inicial?: string | null }) {
  const { inicial = null, onChange, ...resto } = props
  const [valor, setValor] = useState<string | null>(inicial)
  return (
    <DatePicker
      label="Data"
      hoje={HOJE}
      value={valor}
      onChange={(iso) => {
        setValor(iso)
        onChange?.(iso)
      }}
      {...resto}
    />
  )
}

describe('DatePicker', () => {
  it('mostra a data em dd/mm/aaaa com rótulo e asterisco', () => {
    render(<Controlado inicial="2026-11-05" required help="Digite ou escolha no calendário." />)

    const campo = screen.getByRole('textbox', { name: 'Data' })
    expect(campo).toHaveValue('05/11/2026')
    expect(campo).toBeRequired()
    expect(campo).toHaveAccessibleDescription('Digite ou escolha no calendário.')
  })

  it.each(['18112026', '18/11/2026', '18-11-2026'])(
    'aceita "%s" e devolve ISO, formatando ao sair',
    async (digitado) => {
      const aoMudar = vi.fn()
      render(<Controlado onChange={aoMudar} />)
      const campo = screen.getByRole('textbox', { name: 'Data' })

      await userEvent.type(campo, digitado)
      await userEvent.tab()

      expect(aoMudar).toHaveBeenLastCalledWith('2026-11-18')
      expect(campo).toHaveValue('18/11/2026')
    },
  )

  it('recusa dia que não existe: devolve null e mostra o erro ao sair do campo', async () => {
    const aoMudar = vi.fn()
    const aoInvalidar = vi.fn()
    render(<Controlado onChange={aoMudar} onTextoInvalido={aoInvalidar} />)
    const campo = screen.getByRole('textbox', { name: 'Data' })

    await userEvent.type(campo, '31/02/2026')
    expect(screen.queryByText('Informe uma data válida, no formato dd/mm/aaaa.')).not.toBeInTheDocument()
    await userEvent.tab()

    expect(aoMudar).toHaveBeenLastCalledWith(null)
    expect(aoInvalidar).toHaveBeenLastCalledWith('Informe uma data válida, no formato dd/mm/aaaa.')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Informe uma data válida, no formato dd/mm/aaaa.')

    await userEvent.clear(campo)
    expect(aoInvalidar).toHaveBeenLastCalledWith(null)
  })

  it('recusa data fora da faixa 01/01/2000–31/12/2100', async () => {
    const aoMudar = vi.fn()
    render(<Controlado onChange={aoMudar} />)
    const campo = screen.getByRole('textbox', { name: 'Data' })

    await userEvent.type(campo, '31/12/1999')
    await userEvent.tab()

    expect(aoMudar).toHaveBeenLastCalledWith(null)
    expect(screen.getByText('Informe uma data entre 01/01/2000 e 31/12/2100.')).toBeInTheDocument()
  })

  it('ignora letras e mostra o erro vindo do formulário', async () => {
    render(<Controlado error="Informe a data." />)
    const campo = screen.getByRole('textbox', { name: 'Data' })

    await userEvent.type(campo, 'ab')

    expect(campo).toHaveValue('')
    expect(screen.getByText('Informe a data.')).toBeInTheDocument()
  })

  it('abre o calendário em popover, escolhe um dia, fecha e devolve o foco ao campo', async () => {
    const aoMudar = vi.fn()
    render(<Controlado inicial="2026-11-05" onChange={aoMudar} />)
    const botao = screen.getByRole('button', { name: 'Abrir calendário' })
    expect(botao).toHaveAttribute('aria-haspopup', 'dialog')
    expect(botao).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(botao)
    expect(screen.getByRole('dialog', { name: 'Escolher data' })).toBeInTheDocument()
    expect(botao).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: '5 de novembro de 2026' })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: '20 de novembro de 2026' }))

    expect(aoMudar).toHaveBeenLastCalledWith('2026-11-20')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Data' })).toHaveValue('20/11/2026')
    expect(screen.getByRole('textbox', { name: 'Data' })).toHaveFocus()
  })

  it('Esc fecha o calendário', async () => {
    render(<Controlado />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Data' })).toHaveFocus()
  })

  it('escolher no calendário limpa o erro de texto', async () => {
    const aoInvalidar = vi.fn()
    render(<Controlado onTextoInvalido={aoInvalidar} />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Data' }), '99')
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await userEvent.click(screen.getByRole('button', { name: 'Hoje' }))

    expect(aoInvalidar).toHaveBeenLastCalledWith(null)
    expect(screen.getByRole('textbox', { name: 'Data' })).toHaveValue('18/11/2026')
  })

  it('na folha de baixo (celular), mostra o título e fecha pelo ×', async () => {
    render(<Controlado apresentacao="folha" />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    const folha = await screen.findByRole('dialog', { name: 'Data do lançamento' })
    expect(folha).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '10 de novembro de 2026' }))
    expect(await screen.findByRole('textbox', { name: 'Data' }, { timeout: 3000 })).toHaveValue('10/11/2026')
  })

  it('a folha fecha pelo botão Fechar', async () => {
    render(<Controlado apresentacao="folha" />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Fechar' }))

    expect(await screen.findByRole('button', { name: 'Abrir calendário' }, { timeout: 3000 })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('acompanha o valor trocado por fora (reset do formulário)', () => {
    const { rerender } = render(<DatePicker label="Data" value="2026-11-05" onChange={() => {}} hoje={HOJE} />)

    rerender(<DatePicker label="Data" value={null} onChange={() => {}} hoje={HOJE} />)

    expect(screen.getByRole('textbox', { name: 'Data' })).toHaveValue('')
  })

  it('desabilitado, não abre o calendário', () => {
    render(<Controlado disabled />)

    expect(screen.getByRole('textbox', { name: 'Data' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Abrir calendário' })).toBeDisabled()
  })

  it('repassa o ref ao campo (React Hook Form)', () => {
    const ref = vi.fn()
    render(<DatePicker label="Data" value={null} onChange={() => {}} ref={ref} />)

    expect(ref).toHaveBeenCalledWith(screen.getByRole('textbox', { name: 'Data' }))
  })
})
