import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LandingBeneficios } from './landing-beneficios'
import { LandingDados } from './landing-dados'
import { LandingHero } from './landing-hero'
import { LandingPassos } from './landing-passos'

// Organismos estáticos da landing (um teste por arquivo de organismo ficaria repetitivo; todos são só texto e links)
describe('organismos da landing', () => {
  it('LandingHero: título, chamadas e prévia com dados de exemplo', () => {
    render(<LandingHero hrefCadastro="/cadastro" hrefLogin="/login" />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Veja para onde vai o seu dinheiro em cada mês\./ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
    expect(screen.getByRole('link', { name: 'Já tenho conta' })).toHaveAttribute('href', '/login')
    const previa = screen.getByRole('figure', { name: 'Prévia do Início com dados de exemplo' })
    expect(within(previa).getByText('Prévia com dados de exemplo.')).toBeInTheDocument()
    expect(within(previa).getAllByRole('listitem')).toHaveLength(3)
    expect(within(previa).getByText('Dentro do limite')).toBeInTheDocument()
  })

  it('LandingBeneficios: os cinco recursos', () => {
    render(<LandingBeneficios />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Tudo o que você precisa para fechar o mês' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Dashboard do mês',
      'Importação CSV',
      'Categorias',
      'Exportar',
      'Claro ou escuro',
    ])
  })

  it('LandingPassos: três passos numerados e a prévia das categorias', () => {
    render(<LandingPassos />)

    expect(screen.getByRole('heading', { name: /Passo 1:\s*Crie sua conta/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Passo 3:\s*Acompanhe mês a mês/ })).toBeInTheDocument()
    const previa = screen.getByRole('region', { name: 'Prévia: maiores despesas por categoria em novembro de 2026' })
    expect(within(previa).getByText('Aluguel')).toBeInTheDocument()
    expect(within(previa).queryAllByRole('link')).toHaveLength(0)
  })

  it('LandingDados: privacidade e links', () => {
    render(<LandingDados hrefPrivacidade="/privacidade" hrefCadastro="/cadastro" />)

    expect(screen.getByRole('region', { name: 'Seus dados ficam com você' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ler a Política de privacidade' })).toHaveAttribute('href', '/privacidade')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })
})
