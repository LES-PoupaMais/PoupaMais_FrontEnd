import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TopBar } from './top-bar'

describe('TopBar', () => {
  it('mostra o título, o mês e o avatar que leva ao Perfil', () => {
    render(
      <TopBar
        titulo="Início"
        mes={<nav aria-label="Mês exibido" />}
        usuario={{ nome: 'maria' }}
        hrefPerfil="/perfil"
      />,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Início' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Mês exibido' })).toBeInTheDocument()
    const perfil = screen.getByRole('link', { name: 'Seu perfil' })
    expect(perfil).toHaveAttribute('href', '/perfil')
    expect(perfil).toHaveTextContent('M')
  })

  it('sem usuário carregado, ainda não mostra o avatar', () => {
    render(<TopBar titulo="Categorias" hrefPerfil="/perfil" />)

    expect(screen.queryByRole('link', { name: 'Seu perfil' })).toBeNull()
  })

  it('tela interna: Voltar com o destino, sem mês e sem avatar', () => {
    render(
      <TopBar
        titulo="Lixeira"
        voltar={{ href: '/lancamentos', destino: 'Lançamentos' }}
        mes={<nav aria-label="Mês exibido" />}
        usuario={{ nome: 'Maria' }}
        hrefPerfil="/perfil"
      />,
    )

    expect(screen.getByRole('link', { name: 'Voltar para Lançamentos' })).toHaveAttribute('href', '/lancamentos')
    expect(screen.queryByRole('navigation', { name: 'Mês exibido' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Seu perfil' })).toBeNull()
  })
})
