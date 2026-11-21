import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SpendRate } from './spend-rate'

const trilho = (c: HTMLElement) => c.querySelector('[data-slot="spend-rate-trilho"]') as HTMLElement

describe('SpendRate', () => {
  it('dentro do limite: número, barra com marca em 70%, escala, faixa e explicação', () => {
    const { container } = render(<SpendRate taxa={52} classificacao="DENTRO_DO_LIMITE" />)
    expect(screen.getByText('Taxa de gasto')).toBeInTheDocument()
    expect(screen.getByText('52%')).toBeInTheDocument()
    expect(screen.getByText('Dentro do limite')).toBeInTheDocument()
    expect(screen.getByText('Você gastou 52% do que recebeu.')).toBeInTheDocument()

    const barra = trilho(container)
    expect(barra.parentElement).toHaveAttribute('aria-hidden', 'true')
    expect((barra.firstChild as HTMLElement).style.width).toBe('52%')
    expect((container.querySelector('[data-slot="spend-rate-marca"]') as HTMLElement).style.left).toBe('70%')
    expect(container).toHaveTextContent('0%70%100%')
  })

  it('atenção mostra a faixa Atenção', () => {
    render(<SpendRate taxa={86} classificacao="ATENCAO" />)
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(screen.getByText('Você gastou 86% do que recebeu.')).toBeInTheDocument()
  })

  it('acima do limite: barra cheia e o número real', () => {
    const { container } = render(<SpendRate taxa={112} classificacao="ACIMA_DO_LIMITE" />)
    expect(screen.getByText('112%')).toBeInTheDocument()
    expect(screen.getByText('Acima do limite')).toBeInTheDocument()
    expect(screen.getByText('Você gastou 112% do que recebeu: as despesas passaram as receitas.')).toBeInTheDocument()
    expect((trilho(container).firstChild as HTMLElement).style.width).toBe('100%')
  })

  it('sem receitas: "—", "Não disponível para o período" e sem barra preenchida', () => {
    const { container } = render(<SpendRate taxa={null} classificacao={null} semCartao />)
    expect(screen.getByText('Sem valor')).toBeInTheDocument()
    expect(screen.getByText('Não disponível para o período')).toBeInTheDocument()
    expect(screen.getByText('Não há receitas neste mês, então a taxa não é calculada.')).toBeInTheDocument()
    expect(trilho(container)).toBeEmptyDOMElement()
    expect(container).not.toHaveTextContent('70%')
  })

  it('com taxa e sem classificação mostra o número sem inventar a faixa', () => {
    render(<SpendRate taxa={60.6} classificacao={null} />)
    expect(screen.getByText('60,6%')).toBeInTheDocument()
    expect(screen.queryByText(/limite|Atenção/)).not.toBeInTheDocument()
  })
})
