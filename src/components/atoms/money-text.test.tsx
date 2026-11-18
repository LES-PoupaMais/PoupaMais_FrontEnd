import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MENOS } from '@/lib/format'
import { MoneyText } from './money-text'

const textoDe = (el: HTMLElement) => el.textContent?.replace(/ /g, ' ')

describe('MoneyText', () => {
  it('mostra a receita com "+", seta e a cor de receita', () => {
    render(<MoneyText valor={8500} tipo="RECEITA" data-testid="valor" />)
    const valor = screen.getByTestId('valor')

    expect(textoDe(valor)).toBe('+ R$ 8.500,00')
    expect(valor).toHaveClass('text-receita', 'tabular-nums')
    expect(valor.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('mostra a despesa com o menos tipográfico, mesmo se o número vier negativo', () => {
    render(<MoneyText valor={-680} tipo="DESPESA" data-testid="valor" />)

    expect(textoDe(screen.getByTestId('valor'))).toBe(`${MENOS} R$ 680,00`)
    expect(screen.getByTestId('valor')).toHaveClass('text-despesa')
  })

  it('neutro não tem seta e mostra o saldo negativo com "−"', () => {
    render(<MoneyText valor="-750.40" data-testid="valor" />)
    const valor = screen.getByTestId('valor')

    expect(textoDe(valor)).toBe(`${MENOS} R$ 750,40`)
    expect(valor.querySelector('svg')).toBeNull()
  })

  it('anuncia o tipo para o leitor de tela quando pedido', () => {
    render(<MoneyText valor={32.5} tipo="DESPESA" anunciarTipo />)

    expect(screen.getByText('Despesa,')).toHaveClass('sr-only')
  })

  it('fica suave fora do saldo, mantendo o sinal', () => {
    render(<MoneyText valor={88.6} tipo="DESPESA" suave data-testid="valor" />)

    expect(screen.getByTestId('valor')).toHaveClass('text-muted-foreground')
    expect(textoDe(screen.getByTestId('valor'))).toBe(`${MENOS} R$ 88,60`)
  })

  it('com ajustar, fica dentro de um container que encolhe a fonte', () => {
    render(<MoneyText valor={999999999.99} tamanho="destaque" ajustar data-testid="valor" />)

    expect(screen.getByTestId('valor').parentElement).toHaveClass('@container')
    expect(textoDe(screen.getByTestId('valor'))).toBe('R$ 999.999.999,99')
  })
})
