import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('é decorativo (o aviso "Carregando…" fica no contêiner)', () => {
    const { container } = render(<Skeleton forma="texto" className="w-3/5" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstChild).toHaveAttribute('data-slot', 'skeleton')
  })

  it.each(['livre', 'texto', 'titulo', 'valor', 'icone'] as const)('renderiza a forma %s', (forma) => {
    const { container } = render(<Skeleton forma={forma} claro />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
