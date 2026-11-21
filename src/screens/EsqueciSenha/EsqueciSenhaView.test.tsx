import { render, screen } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/msw/server'
import { renderComProviders } from '@/test/utils'
import { EsqueciSenhaProvider, useEsqueciSenhaContext } from './EsqueciSenhaContext'
import { EsqueciSenhaView } from './EsqueciSenhaView'

const renderizar = () =>
  renderComProviders(
    <EsqueciSenhaProvider>
      <EsqueciSenhaView />
    </EsqueciSenhaProvider>,
  )

describe('Esqueci a senha (RN014)', () => {
  it('pede o link e mostra a mesma resposta, exista a conta ou não; "Enviar de novo" volta preenchido', async () => {
    let corpo: unknown
    server.use(
      msw.post('*/api/auth/recuperar-senha', async ({ request }) => {
        corpo = await request.json()
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { usuario } = renderizar()

    expect(screen.getByRole('heading', { level: 1, name: 'Esqueci minha senha' })).toBeInTheDocument()
    await usuario.type(screen.getByLabelText('E-mail'), 'ana@x.com')
    await usuario.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Confira o seu e-mail' })).toBeInTheDocument()
    expect(screen.getByText('Pedido recebido para ana@x.com.')).toBeInTheDocument()
    expect(corpo).toEqual({ email: 'ana@x.com' })

    await usuario.click(screen.getByRole('button', { name: 'Enviar de novo' }))
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@x.com')
  })

  it('servidor fora do ar: aviso traduzido e continua no formulário', async () => {
    server.use(
      msw.post('*/api/auth/recuperar-senha', () =>
        HttpResponse.json({ status: 503, mensagem: 'Connection refused' }, { status: 503 }),
      ),
    )
    const { usuario } = renderizar()

    await usuario.type(screen.getByLabelText('E-mail'), 'ana@x.com')
    await usuario.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('O servidor está indisponível no momento.')
    expect(screen.queryByText('Connection refused')).not.toBeInTheDocument()
  })

  it('o Context exige o Provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      useEsqueciSenhaContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<EsqueciSenhaProvider>/)
  })
})
