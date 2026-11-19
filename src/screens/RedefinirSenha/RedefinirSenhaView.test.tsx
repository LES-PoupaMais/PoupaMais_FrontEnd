import { render, screen, waitFor } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'
import { renderComProviders } from '@/test/utils'
import { RedefinirSenhaProvider, useRedefinirSenhaContext } from './RedefinirSenhaContext'
import { RedefinirSenhaSkeleton } from './RedefinirSenhaSkeleton'
import { RedefinirSenhaView } from './RedefinirSenhaView'

const { replace, toastSucesso } = vi.hoisted(() => ({ replace: vi.fn(), toastSucesso: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))
vi.mock('sonner', () => ({ toast: { success: toastSucesso, error: vi.fn() } }))

const renderizar = (token?: string) =>
  renderComProviders(
    <RedefinirSenhaProvider token={token}>
      <RedefinirSenhaView />
    </RedefinirSenhaProvider>,
  )

async function salvar(usuario: ReturnType<typeof renderizar>['usuario']) {
  await usuario.type(screen.getByLabelText('Nova senha'), '123456')
  await usuario.type(screen.getByLabelText('Confirmar nova senha'), '123456')
  await usuario.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
}

describe('Redefinir senha', () => {
  beforeEach(() => vi.clearAllMocks())

  it('salva a nova senha com o token do link e leva ao login com toast', async () => {
    let corpo: unknown
    server.use(
      msw.post('*/api/auth/redefinir-senha', async ({ request }) => {
        corpo = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { usuario } = renderizar('tok-123')

    await salvar(usuario)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(corpo).toEqual({ token: 'tok-123', novaSenha: '123456' })
    expect(toastSucesso).toHaveBeenCalledWith('Senha nova salva. Entre com ela.')
  })

  it('token inválido ou expirado (422) mostra "Este link expirou"', async () => {
    server.use(
      msw.post('*/api/auth/redefinir-senha', () =>
        HttpResponse.json({ status: 422, mensagem: 'Token expirado' }, { status: 422 }),
      ),
    )
    const { usuario } = renderizar('tok-velho')

    await salvar(usuario)

    expect(await screen.findByRole('heading', { level: 1, name: 'Este link expirou' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir outro link' })).toHaveAttribute('href', '/esqueci-senha')
  })

  it('sem token na URL já mostra o link expirado', () => {
    renderizar()

    expect(screen.getByRole('heading', { level: 1, name: 'Este link expirou' })).toBeInTheDocument()
  })

  it('outros erros viram aviso traduzido no formulário', async () => {
    server.use(msw.post('*/api/auth/redefinir-senha', () => HttpResponse.error()))
    const { usuario } = renderizar('tok')

    await salvar(usuario)

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível conectar ao servidor/)
  })

  it('esqueleto e Context fora do Provider', () => {
    render(<RedefinirSenhaSkeleton />)
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()

    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useRedefinirSenhaContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<RedefinirSenhaProvider>/)
  })
})
