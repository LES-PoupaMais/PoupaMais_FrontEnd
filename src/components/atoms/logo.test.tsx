import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Logo } from './logo'

const fontes = (el: HTMLElement) => Array.from(el.querySelectorAll('img')).map((img) => img.getAttribute('src'))

describe('Logo', () => {
  it('tem nome acessível e as duas versões (claro e escuro) do horizontal', () => {
    render(<Logo />)
    const logo = screen.getByRole('img', { name: 'PoupaMais' })

    expect(fontes(logo).join(' ')).toMatch(/poupamais-navbar\.jpg.*poupamais-cofrinho-escuro\.jpg/)
    expect(logo).toHaveTextContent('PoupaMais')
  })

  it('na sidebar mostra o cofrinho com o nome em texto', () => {
    render(<Logo variante="sidebar" />)
    const logo = screen.getByRole('img', { name: 'PoupaMais' })

    expect(fontes(logo).join(' ')).toMatch(/poupamais-cofrinho\.jpg.*poupamais-cofrinho-escuro\.jpg/)
    expect(logo).toHaveTextContent('PoupaMais')
  })

  it('no trilho mostra só o cofrinho', () => {
    render(<Logo variante="cofrinho" />)

    expect(screen.getByRole('img', { name: 'PoupaMais' })).toHaveTextContent('')
  })
})
