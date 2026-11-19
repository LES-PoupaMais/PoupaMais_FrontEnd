import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MoneyField, type MoneyFieldProps } from './money-field'

function Controlado({ inicial = null, onChange, ...props }: Partial<MoneyFieldProps> & { inicial?: number | null }) {
  const [valor, setValor] = useState<number | null>(inicial)
  return (
    <MoneyField
      label="Valor"
      value={valor}
      onChange={(v) => {
        setValor(v)
        onChange?.(v)
      }}
      {...props}
    />
  )
}

describe('MoneyField', () => {
  it('teclado decimal, prefixo R$ escondido do leitor e placeholder 0,00', () => {
    render(<Controlado required />)

    const campo = screen.getByRole('textbox', { name: 'Valor' })
    expect(campo).toHaveAttribute('inputmode', 'decimal')
    expect(campo).toHaveAttribute('type', 'text')
    expect(campo).toHaveAttribute('placeholder', '0,00')
    expect(screen.getByText('R$')).toHaveAttribute('aria-hidden', 'true')
  })

  it.each([
    ['180', 180, '180,00'],
    ['180,5', 180.5, '180,50'],
    ['1.234,56', 1234.56, '1.234,56'],
    ['R$ 1.234,56', 1234.56, '1.234,56'],
    ['-80', 80, '80,00'],
  ])('lê "%s" como %s e mostra "%s" ao sair', async (digitado, numero, mostrado) => {
    const aoMudar = vi.fn()
    render(<Controlado onChange={aoMudar} />)
    const campo = screen.getByRole('textbox', { name: 'Valor' })

    await userEvent.type(campo, digitado)
    await userEvent.tab()

    expect(aoMudar).toHaveBeenLastCalledWith(numero)
    expect(campo).toHaveValue(mostrado)
  })

  it('vazio devolve null', async () => {
    const aoMudar = vi.fn()
    render(<Controlado inicial={10} onChange={aoMudar} />)
    const campo = screen.getByRole('textbox', { name: 'Valor' })
    expect(campo).toHaveValue('10,00')

    await userEvent.clear(campo)
    await userEvent.tab()

    expect(aoMudar).toHaveBeenLastCalledWith(null)
    expect(campo).toHaveValue('')
  })

  it('mostra a prévia com o sinal do tipo, sem o sinal ser digitado', async () => {
    render(<Controlado tipo="DESPESA" />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Valor' }), '1234,56')

    const previa = screen.getByText(/vai aparecer como/)
    expect(previa).toHaveAttribute('aria-live', 'polite')
    expect(previa).toHaveTextContent('Despesa: vai aparecer como − R$ 1.234,56')
    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveAccessibleDescription(
      /^Despesa: vai aparecer como − R\$\s1\.234,56$/,
    )
  })

  it('receita aparece com "+"; zero não mostra prévia', async () => {
    const { rerender } = render(<MoneyField label="Valor" value={8500} onChange={() => {}} tipo="RECEITA" />)
    expect(screen.getByText(/Receita: vai aparecer como/)).toHaveTextContent('+ R$ 8.500,00')

    rerender(<MoneyField label="Valor" value={0} onChange={() => {}} tipo="RECEITA" />)
    expect(screen.queryByText(/vai aparecer como/)).not.toBeInTheDocument()
  })

  it('acompanha o valor trocado por fora e mostra o erro', () => {
    const { rerender } = render(<MoneyField label="Valor" value={680} onChange={() => {}} />)
    rerender(<MoneyField label="Valor" value={null} onChange={() => {}} error="Informe um valor maior que zero." />)

    const campo = screen.getByRole('textbox', { name: 'Valor' })
    expect(campo).toHaveValue('')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Informe um valor maior que zero.')
  })

  it('chama o onBlur de quem usa (React Hook Form) e respeita disabled', async () => {
    const aoSair = vi.fn()
    render(<MoneyField label="Valor" value={680} onChange={() => {}} onBlur={aoSair} />)

    await userEvent.click(screen.getByRole('textbox', { name: 'Valor' }))
    await userEvent.tab()
    expect(aoSair).toHaveBeenCalledOnce()
  })
})
