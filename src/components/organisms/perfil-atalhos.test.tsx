import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PrivacidadeConta, SeusLancamentos, textoDaLixeira, textoDasCategorias } from './perfil-atalhos'

describe('textos das contagens', () => {
  it('lixeira e categorias no singular, plural e vazio', () => {
    expect(textoDaLixeira(3)).toBe('3 lançamentos excluídos para restaurar')
    expect(textoDaLixeira(1)).toBe('1 lançamento excluído para restaurar')
    expect(textoDaLixeira(0)).toBe('Nenhum lançamento na lixeira')
    expect(textoDasCategorias(10, 2)).toBe('10 ativas e 2 inativas')
    expect(textoDasCategorias(1, 0)).toBe('1 ativa')
    expect(textoDasCategorias(0, 1)).toBe('1 inativa')
    expect(textoDasCategorias(0, 0)).toBe('Nenhuma categoria')
  })
})

describe('SeusLancamentos', () => {
  it('links para a Lixeira e Categorias com as contagens (sem legenda enquanto carrega)', () => {
    const { rerender } = render(<SeusLancamentos hrefLixeira="/lancamentos/lixeira" hrefCategorias="/categorias" />)
    const lixeira = screen.getByRole('link', { name: /Lixeira de Lançamentos/ })
    expect(lixeira).toHaveAttribute('href', '/lancamentos/lixeira')
    expect(lixeira).toHaveTextContent(/^Lixeira de Lançamentos$/)

    rerender(
      <SeusLancamentos
        hrefLixeira="/lancamentos/lixeira"
        hrefCategorias="/categorias"
        totalLixeira={3}
        categorias={{ ativas: 10, inativas: 2 }}
      />,
    )
    expect(screen.getByRole('link', { name: /3 lançamentos excluídos/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /10 ativas e 2 inativas/ })).toHaveAttribute('href', '/categorias')
  })
})

describe('PrivacidadeConta', () => {
  it('baixar dados, excluir conta e a Política', async () => {
    const onBaixarDados = vi.fn()
    const onExcluirConta = vi.fn()
    render(
      <PrivacidadeConta hrefPrivacidade="/privacidade" onBaixarDados={onBaixarDados} onExcluirConta={onExcluirConta} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /Baixar meus dados/ }))
    await userEvent.click(screen.getByRole('button', { name: /Excluir minha conta/ }))
    expect(onBaixarDados).toHaveBeenCalled()
    expect(onExcluirConta).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Ler a Política de privacidade' })).toHaveAttribute('href', '/privacidade')
  })

  it('baixando e sem conexão', () => {
    const { rerender } = render(
      <PrivacidadeConta hrefPrivacidade="/p" onBaixarDados={vi.fn()} onExcluirConta={vi.fn()} baixando />,
    )
    expect(screen.getByRole('button', { name: /Baixando seus dados…/ })).toBeDisabled()
    rerender(
      <PrivacidadeConta hrefPrivacidade="/p" onBaixarDados={vi.fn()} onExcluirConta={vi.fn()} bloqueado idMotivo="m" />,
    )
    expect(screen.getByRole('button', { name: /Excluir minha conta/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Excluir minha conta/ })).toHaveAttribute('aria-describedby', 'm')
  })
})
