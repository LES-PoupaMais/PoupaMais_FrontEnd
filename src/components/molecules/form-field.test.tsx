import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { FormField, juntarIds } from './form-field'

describe('FormField', () => {
  it('liga rótulo, ajuda e contador ao campo (elemento como filho)', () => {
    render(
      <FormField label="Descrição" help="Ex.: Mercado do mês" required contador={{ atual: 12, maximo: 100 }}>
        <Input placeholder="Ex.: Mercado do mês" />
      </FormField>,
    )

    const campo = screen.getByRole('textbox', { name: 'Descrição' })
    expect(campo).toBeRequired()
    expect(campo).not.toHaveAttribute('aria-invalid')
    expect(campo).toHaveAccessibleDescription('Ex.: Mercado do mês 12/100')
  })

  it('com erro: mostra a mensagem no lugar da ajuda e marca aria-invalid', () => {
    render(
      <FormField label="Descrição" help="Ajuda" error="Informe a descrição.">
        <Input aria-describedby="extra" />
      </FormField>,
    )

    const campo = screen.getByRole('textbox', { name: 'Descrição' })
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo.getAttribute('aria-describedby')).toMatch(/-erro extra$/)
    expect(screen.queryByText('Ajuda')).not.toBeInTheDocument()
    expect(screen.getByText('Informe a descrição.')).toBeInTheDocument()
  })

  it('aceita função como filho, com id próprio e desabilitado', () => {
    render(
      <FormField label="Observação" id="obs" disabled>
        {(controle) => <Textarea {...controle} />}
      </FormField>,
    )

    const campo = screen.getByRole('textbox', { name: 'Observação' })
    expect(campo).toHaveAttribute('id', 'obs')
    expect(campo).toBeDisabled()
    expect(campo).not.toHaveAttribute('aria-describedby')
  })

  it('destaca o contador perto do limite', () => {
    render(
      <FormField label="Descrição" contador={{ atual: 95, maximo: 100 }}>
        <Input />
      </FormField>,
    )

    expect(screen.getByText('95/100')).toHaveClass('text-destructive')
  })

  it('juntarIds ignora vazios', () => {
    expect(juntarIds('a', false, null, 'b')).toBe('a b')
    expect(juntarIds(undefined)).toBeUndefined()
  })
})
