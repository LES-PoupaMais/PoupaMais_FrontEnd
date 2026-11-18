import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabeledProgress } from './labeled-progress'

describe('LabeledProgress', () => {
  it('em andamento mostra os números e quanto falta', () => {
    render(<LabeledProgress titulo="Progresso" atual={680} total={1000} />)
    const barra = screen.getByRole('progressbar', { name: 'Progresso' })
    expect(barra).toHaveAttribute('aria-valuetext', expect.stringMatching(/^68%, faltam R\$\s320,00$/))
    expect(screen.getByText(/R\$\s680,00 de R\$\s1\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/Faltam R\$\s320,00/)).toBeInTheDocument()
  })

  it('completo mostra "Fechou 100%"', () => {
    render(<LabeledProgress titulo="Progresso" atual="1000.00" total={1000} />)
    expect(screen.getByText('Fechou 100%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '100%, completo')
  })

  it('passou do total mostra quanto passou, com a barra cheia', () => {
    render(<LabeledProgress titulo="Progresso" atual={1045} total={1000} />)
    expect(screen.getByText(/Passou R\$\s45,00 do total/)).toBeInTheDocument()
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '100')
    expect(barra).toHaveAttribute('aria-valuetext', expect.stringMatching(/Passou do total em R\$\s45,00/))
  })

  it('aceita status e cor próprios e total zero', () => {
    render(<LabeledProgress titulo="Meta" atual={0} total={0} status="Sem meta" cor="atencao" />)
    expect(screen.getByText('Sem meta')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Sem meta')
  })
})
