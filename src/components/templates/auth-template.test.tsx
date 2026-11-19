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
    expect(screen.getByRole('link', { name: 'PoupaMais, ir para a página inicial' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Política de privacidade' })).toHaveAttribute('href', '/privacidade')
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
