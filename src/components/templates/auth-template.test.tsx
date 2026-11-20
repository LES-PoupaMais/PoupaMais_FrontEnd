import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Mail } from 'lucide-react'
import { AuthTemplate } from './auth-template'

describe('AuthTemplate', () => {
  it('mostra logo, título, subtítulo, conteúdo e rodapé, seguindo o tema (sem forçar o escuro)', () => {
    const { container } = render(
      <AuthTemplate titulo="Bem-vindo de volta" subtitulo="Entre na sua conta para continuar." rodape="Não tem conta?">
        formulário
      </AuthTemplate>,
    )

    expect(container.firstChild).not.toHaveClass('dark')
    expect(screen.getByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByText('Entre na sua conta para continuar.')).toBeInTheDocument()
    expect(screen.getByText('formulário')).toBeInTheDocument()
    expect(screen.getByText('Não tem conta?')).toBeInTheDocument()
    // Dois logos: o pequeno do topo (celular) e o grande do cartão (tablet e computador); o CSS mostra só um
    const logos = screen.getAllByRole('link', { name: 'PoupaMais, ir para a página inicial' })
    expect(logos).toHaveLength(2)
    logos.forEach((logo) => expect(logo).toHaveAttribute('href', '/'))
    expect(screen.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute('href', '/privacidade')
    expect(screen.getByRole('link', { name: 'Política de privacidade' })).toHaveClass('underline')
  })

  it('ações do topo: a do celular sempre; a do computador só com o texto lateral', () => {
    const { rerender } = render(
      <AuthTemplate
        titulo="Esqueci minha senha"
        acaoCelular={<a href="/login">Entrar</a>}
        acaoComputador={<a href="/login">Já tenho conta</a>}
      >
        formulário
      </AuthTemplate>,
    )

    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Já tenho conta' })).not.toBeInTheDocument()

    rerender(
      <AuthTemplate
        titulo="Criar conta"
        subtitulo="Comece a organizar as suas finanças pelo mês atual."
        subtituloComLateral="Só nome, e-mail e senha."
        lateral={<p>Comece a organizar o seu dinheiro</p>}
        acaoComputador={<a href="/login">Já tenho conta</a>}
      >
        formulário
      </AuthTemplate>,
    )

    expect(screen.getByRole('link', { name: 'Já tenho conta' })).toBeInTheDocument()
    expect(screen.getByText('Comece a organizar as suas finanças pelo mês atual.')).toBeInTheDocument()
    expect(screen.getByText('Só nome, e-mail e senha.')).toBeInTheDocument()
  })

  it('subtítulo do computador só existe com o texto lateral', () => {
    render(
      <AuthTemplate titulo="Criar conta" subtitulo="Comece a organizar." subtituloComLateral="Só nome, e-mail e senha.">
        formulário
      </AuthTemplate>,
    )

    expect(screen.queryByText('Só nome, e-mail e senha.')).not.toBeInTheDocument()
  })

  it('cartão também no celular (link expirado)', () => {
    const { container } = render(
      <AuthTemplate titulo="Este link expirou" cartaoNoCelular>
        ações
      </AuthTemplate>,
    )

    expect(container.querySelector('[data-slot="auth-cartao"]')).toHaveClass('bg-card')
  })

  it('sem subtítulo nem rodapé, mostra só o essencial', () => {
    render(<AuthTemplate titulo="Criar conta">formulário</AuthTemplate>)

    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.queryByText('Não tem conta?')).not.toBeInTheDocument()
  })

  it('props opcionais: aviso acima do título, ícone decorativo e texto lateral do computador', () => {
    const { container } = render(
      <AuthTemplate
        titulo="Entre de novo"
        aviso={<p role="status">Sua sessão venceu.</p>}
        icone={{ Icone: Mail, tom: 'primaria' }}
        lateral={<p>Comece a organizar o seu dinheiro</p>}
      >
        formulário
      </AuthTemplate>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão venceu.')
    expect(container.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument()
    expect(screen.getByText('Comece a organizar o seu dinheiro')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Entre de novo' })).toBeInTheDocument()
  })
})
