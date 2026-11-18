import { render } from '@testing-library/react'
import { Tags } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { FunctionIcon } from './function-icon'

describe('FunctionIcon', () => {
  it('é decorativo e expõe a função', () => {
    const { container } = render(<FunctionIcon funcao="receita" />)
    const caixa = container.firstChild as HTMLElement
    expect(caixa).toHaveAttribute('aria-hidden', 'true')
    expect(caixa).toHaveAttribute('data-funcao', 'receita')
    expect(caixa.querySelector('svg')).toHaveClass('lucide-arrow-up-right')
  })

  it('usa a seta para baixo na despesa e a carteira na primária', () => {
    const { container, rerender } = render(<FunctionIcon funcao="despesa" />)
    expect(container.querySelector('svg')).toHaveClass('lucide-arrow-down-right')
    rerender(<FunctionIcon funcao="primaria" tamanho={24} />)
    expect(container.querySelector('svg')).toHaveClass('lucide-wallet')
  })

  it('aceita o ícone do contexto e é neutro por padrão', () => {
    const { container } = render(<FunctionIcon icone={Tags} />)
    expect(container.firstChild).toHaveAttribute('data-funcao', 'neutro')
    expect(container.querySelector('svg')).toHaveClass('lucide-tags')
  })
})
