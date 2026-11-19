import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderComProviders } from '@/test/utils'
import { LoginProvider, useLoginContext } from './LoginContext'
import { LoginSkeleton } from './LoginSkeleton'
import { LoginView } from './LoginView'

const { replace, loginAction } = vi.hoisted(() => ({ replace: vi.fn(), loginAction: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))
vi.mock('@/actions/auth.actions', () => ({ loginAction }))

const renderizar = (props: { voltar?: string; sessao?: string } = {}) =>
  renderComProviders(
    <LoginProvider {...props}>
      <LoginView />
    </LoginProvider>,
  )

async function entrar(usuario: ReturnType<typeof renderizar>['usuario']) {
  await usuario.type(screen.getByLabelText('E-mail'), 'ana@x.com')
  await usuario.type(screen.getByLabelText('Senha'), 'segredo')
  await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra o formulário, o esqueci a senha e o caminho para criar conta', () => {
    renderizar()

    expect(screen.getByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
    expect(screen.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute('href', '/esqueci-senha')
  })

  it('ao entrar, limpa o cache da sessão anterior e volta para a página pedida', async () => {
    loginAction.mockResolvedValue({ ok: true })
    const { usuario, queryClient } = renderizar({ voltar: '/lancamentos/novo' })
    queryClient.setQueryData(['usuario'], { nome: 'Outra pessoa' })

    await entrar(usuario)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/lancamentos/novo'))
    expect(loginAction).toHaveBeenCalledWith({ email: 'ana@x.com', senha: 'segredo' })
    expect(queryClient.getQueryData(['usuario'])).toBeUndefined()
  })

  it('destino externo cai no dashboard', async () => {
    loginAction.mockResolvedValue({ ok: true })
    const { usuario } = renderizar({ voltar: 'https://site.com' })

    await entrar(usuario)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'))
  })

  it('credenciais inválidas: mensagem genérica, sem dizer qual campo', async () => {
    loginAction.mockResolvedValue({ ok: false, status: 401, erros: [] })
    const { usuario } = renderizar()

    await entrar(usuario)

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(replace).not.toHaveBeenCalled()
  })

  it('servidor fora do ar: mensagem traduzida, nunca a da API', async () => {
    loginAction.mockResolvedValue({ ok: false, status: 0, erros: [] })
    const { usuario } = renderizar()

    await entrar(usuario)

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível conectar ao servidor/)
  })

  it('sessão vencida: aviso, título "Entre de novo" e a tela para onde volta', () => {
    renderizar({ voltar: '/lancamentos/novo', sessao: 'vencida' })

    expect(screen.getByRole('heading', { level: 1, name: 'Entre de novo' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão venceu. Entre de novo para continuar.')
    expect(screen.getByText('Depois de entrar, você volta para a tela Novo lançamento.')).toBeInTheDocument()
  })

  it('sessão vencida com destino desconhecido fala da página em que estava', () => {
    renderizar({ voltar: '/algum-lugar', sessao: 'vencida' })

    expect(screen.getByText('Depois de entrar, você volta para a página em que estava.')).toBeInTheDocument()
  })

  it('sem internet: aviso e Entrar desabilitado', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    renderizar()

    expect(screen.getByText(/Sem internet agora/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeDisabled()
    vi.restoreAllMocks()
  })

  it('o esqueleto mostra o carregamento e o Context exige o Provider', () => {
    render(<LoginSkeleton />)
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()

    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useLoginContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<LoginProvider>/)
  })
})
