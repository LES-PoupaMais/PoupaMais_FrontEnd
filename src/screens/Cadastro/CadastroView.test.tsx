import { render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderComProviders } from '@/test/utils'
import { CadastroProvider, useCadastroContext } from './CadastroContext'
import { CadastroView } from './CadastroView'

const { replace, cadastroAction, toastSucesso } = vi.hoisted(() => ({
  replace: vi.fn(),
  cadastroAction: vi.fn(),
  toastSucesso: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))
vi.mock('@/actions/auth.actions', () => ({ cadastroAction }))
vi.mock('sonner', () => ({ toast: { success: toastSucesso, error: vi.fn() } }))

// O checkbox do Radix dentro de <form> mede a caixa com ResizeObserver, que o jsdom não tem
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const renderizar = () =>
  renderComProviders(
    <CadastroProvider>
      <CadastroView />
    </CadastroProvider>,
  )

async function preencherEEnviar(usuario: ReturnType<typeof renderizar>['usuario']) {
  await usuario.type(screen.getByLabelText('Nome completo'), 'Ana Souza')
  await usuario.type(screen.getByLabelText('E-mail'), 'ana@x.com')
  await usuario.type(screen.getByLabelText('Senha'), '123456')
  await usuario.type(screen.getByLabelText('Confirmar senha'), '123456')
  await usuario.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
  await usuario.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('Cadastro', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra o título e os caminhos para entrar e para a política', () => {
    renderizar()

    expect(screen.getByRole('heading', { level: 1, name: 'Criar conta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade')
  })

  it('cria a conta, limpa o cache, avisa e entra direto no Dashboard', async () => {
    cadastroAction.mockResolvedValue({ ok: true })
    const { usuario, queryClient } = renderizar()
    queryClient.setQueryData(['x'], 1)

    await preencherEEnviar(usuario)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'))
    expect(cadastroAction).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@x.com', aceiteTermos: true }))
    expect(toastSucesso).toHaveBeenCalled()
    expect(queryClient.getQueryData(['x'])).toBeUndefined()
  })

  it('e-mail já usado (409) aparece no campo', async () => {
    cadastroAction.mockResolvedValue({ ok: false, status: 409, erros: [] })
    const { usuario } = renderizar()

    await preencherEEnviar(usuario)

    expect(await screen.findByText('Já existe uma conta com esse e-mail.')).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('erros por campo da API (400) vão para os campos, traduzidos', async () => {
    cadastroAction.mockResolvedValue({ ok: false, status: 400, erros: [{ campo: 'nome', mensagem: 'size must be…' }] })
    const { usuario } = renderizar()

    await preencherEEnviar(usuario)

    expect(await screen.findByText('Confira este campo.')).toBeInTheDocument()
    expect(screen.queryByText('size must be…')).not.toBeInTheDocument()
  })

  it('outros erros viram aviso traduzido', async () => {
    cadastroAction.mockResolvedValue({ ok: false, status: 500, erros: [] })
    const { usuario } = renderizar()

    await preencherEEnviar(usuario)

    expect(await screen.findByText('Não foi possível concluir a operação. Tente novamente.')).toBeInTheDocument()
  })

  it('o Context exige o Provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useCadastroContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<CadastroProvider>/)
  })
})
