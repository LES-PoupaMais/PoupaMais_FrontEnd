import { render, screen, waitFor, within } from '@testing-library/react'
import { http as msw, HttpResponse } from 'msw/http'
import { ThemeProvider } from 'next-themes'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/lib/http'
import { lancamentosDemo, server, usuarioDemo } from '@/test/msw/server-e-dados'
import { renderComProviders } from '@/test/utils'
import { PerfilProvider, usePerfilContext } from './PerfilContext'
import { PerfilSkeleton } from './PerfilSkeleton'
import { PerfilView } from './PerfilView'

const rota = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: rota.replace }) }))

const acoes = vi.hoisted(() => ({ trocarSenha: vi.fn(), excluirConta: vi.fn(), logout: vi.fn() }))
vi.mock('@/actions/perfil.actions', () => ({
  trocarSenhaAction: acoes.trocarSenha,
  excluirContaAction: acoes.excluirConta,
}))
vi.mock('@/actions/auth.actions', () => ({ logoutAction: acoes.logout }))

const avisos = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: avisos }))

const renderizar = () =>
  renderComProviders(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PerfilProvider>
        <PerfilView />
      </PerfilProvider>
    </ThemeProvider>,
  )

const definirOnline = (online: boolean) =>
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => online })

describe('Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    definirOnline(true)
  })
  afterEach(() => definirOnline(true))

  it('carrega o perfil com as contagens de lixeira e categorias', async () => {
    renderizar()
    expect(screen.getByLabelText('Carregando o perfil')).toHaveAttribute('aria-busy', 'true')

    expect(await screen.findByLabelText('Nome')).toHaveValue(usuarioDemo.nome)
    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue(usuarioDemo.email)
    const lixeira = lancamentosDemo.filter((l) => l.status === 'DELETADO').length
    expect(await screen.findByRole('link', { name: /Lixeira de Lançamentos/ })).toHaveTextContent(
      lixeira === 1
        ? '1 lançamento excluído'
        : lixeira === 0
          ? 'Nenhum lançamento'
          : `${lixeira} lançamentos excluídos`,
    )
    expect(await screen.findByRole('link', { name: /3 ativas e 1 inativa/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeInTheDocument()
  })

  it('erro ao carregar mostra "Tentar de novo", que busca outra vez', async () => {
    let falhar = true
    server.use(
      msw.get('*/api/usuarios/me', () =>
        falhar ? HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 }) : HttpResponse.json(usuarioDemo),
      ),
    )
    renderizar()
    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument()

    falhar = false
    await screen.findByRole('button', { name: 'Tentar de novo' }).then((b) => b.click())
    expect(await screen.findByLabelText('Nome')).toHaveValue(usuarioDemo.nome)
  })

  it('salva o nome com toast; erro da API vira toast e mensagem no campo', async () => {
    let falhar = false
    server.use(
      msw.put('*/api/usuarios/me', async ({ request }) =>
        falhar
          ? HttpResponse.json(
              { status: 400, mensagem: 'x', erros: [{ campo: 'nome', mensagem: 'tamanho' }] },
              { status: 400 },
            )
          : HttpResponse.json({ ...usuarioDemo, ...((await request.json()) as object) }),
      ),
    )
    const { usuario } = renderizar()
    const campo = await screen.findByLabelText('Nome')
    await usuario.clear(campo)
    await usuario.type(campo, 'Leonardo Nascimento')
    await usuario.click(screen.getByRole('button', { name: 'Salvar nome' }))
    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith('Nome salvo'))

    falhar = true
    await usuario.click(screen.getByRole('button', { name: 'Salvar nome' }))
    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith('Não foi possível salvar o nome.'))
    expect(await screen.findByText('Confira o nome: use até 150 caracteres.')).toBeInTheDocument()
  })

  it('foto: recusa antes de enviar acima de 2 MB; envia a válida; traduz o 422 da API; remove', async () => {
    let possuiFoto = false
    server.use(
      msw.get('*/api/usuarios/me', () => HttpResponse.json({ ...usuarioDemo, possuiFoto })),
      msw.delete('*/api/usuarios/me/foto', () => {
        possuiFoto = false
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const put = vi.spyOn(http, 'put').mockImplementationOnce(async () => {
      possuiFoto = true
      return undefined
    })
    const { usuario } = renderizar()
    const grande = new File(['x'], 'g.png', { type: 'image/png' })
    Object.defineProperty(grande, 'size', { value: 3 * 1024 * 1024 })

    await usuario.upload(await screen.findByLabelText('Enviar foto'), grande)
    expect(screen.getByRole('alert')).toHaveTextContent('A foto deve ter no máximo 2 MB. Escolha uma imagem menor.')
    expect(put).not.toHaveBeenCalled()

    await usuario.upload(screen.getByLabelText('Enviar foto'), new File(['x'], 'eu.png', { type: 'image/png' }))
    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith('Foto atualizada'))
    expect(await screen.findByLabelText('Trocar foto')).toBeInTheDocument()

    const { ErroApi } = await import('@/lib/http')
    put.mockRejectedValueOnce(new ErroApi(422, 'A foto deve ser uma imagem JPG, PNG ou WEBP'))
    await usuario.upload(screen.getByLabelText('Trocar foto'), new File(['x'], 'eu.webp', { type: 'image/webp' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A foto deve ser uma imagem JPG, PNG ou WEBP.')

    await usuario.click(screen.getByRole('button', { name: 'Remover foto' }))
    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith('Foto removida'))
    expect(await screen.findByLabelText('Enviar foto')).toBeInTheDocument()
    put.mockRestore()
  })

  it('troca a senha: sucesso limpa e avisa; senha atual errada aparece no campo; sessão vencida vai ao login', async () => {
    const { usuario } = renderizar()
    const preencher = async () => {
      await usuario.type(await screen.findByLabelText('Senha atual'), 'poupa2025')
      await usuario.type(screen.getByLabelText('Nova senha'), 'poupa2026')
      await usuario.type(screen.getByLabelText('Confirmar nova senha'), 'poupa2026')
      await usuario.click(screen.getByRole('button', { name: 'Alterar senha' }))
    }

    acoes.trocarSenha.mockResolvedValueOnce({ ok: false, motivo: 'senha-incorreta' })
    await preencher()
    expect(await screen.findByText('A senha atual está incorreta.')).toBeInTheDocument()
    expect(acoes.trocarSenha).toHaveBeenCalledWith({ senhaAtual: 'poupa2025', novaSenha: 'poupa2026' })

    for (const campo of ['Senha atual', 'Nova senha', 'Confirmar nova senha'])
      await usuario.clear(screen.getByLabelText(campo))
    acoes.trocarSenha.mockResolvedValueOnce({ ok: true })
    await preencher()
    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith('Senha alterada'))
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')

    acoes.trocarSenha.mockResolvedValueOnce({ ok: false, motivo: 'senha-igual' })
    await preencher()
    expect(await screen.findByText('A nova senha deve ser diferente da atual.')).toBeInTheDocument()

    for (const campo of ['Senha atual', 'Nova senha', 'Confirmar nova senha'])
      await usuario.clear(screen.getByLabelText(campo))
    acoes.trocarSenha.mockResolvedValueOnce({ ok: false, motivo: 'sessao' })
    await preencher()
    await waitFor(() => expect(rota.replace).toHaveBeenCalledWith('/login?voltar=%2Fperfil'))

    for (const campo of ['Senha atual', 'Nova senha', 'Confirmar nova senha'])
      await usuario.clear(screen.getByLabelText(campo))
    acoes.trocarSenha.mockResolvedValueOnce({ ok: false, motivo: 'erro' })
    await preencher()
    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith('Não foi possível alterar a senha.'))
  })

  it('troca o tema e guarda a escolha neste navegador', async () => {
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('radio', { name: 'Escuro' }))
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('baixa os dados com o nome do Content-Disposition', async () => {
    server.use(
      msw.get(
        '*/api/usuarios/me/dados',
        () =>
          new HttpResponse('{}', {
            headers: { 'Content-Disposition': 'attachment; filename="meus-dados-poupamais.json"' },
          }),
      ),
    )
    const original = { criar: URL.createObjectURL, revogar: URL.revokeObjectURL }
    URL.createObjectURL = vi.fn(() => 'blob:dados')
    URL.revokeObjectURL = vi.fn()
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('meus-dados-poupamais.json')
    })
    const { usuario } = renderizar()

    await usuario.click(await screen.findByRole('button', { name: /Baixar meus dados/ }))
    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith('Seus dados foram baixados'))
    expect(clique).toHaveBeenCalled()

    server.use(
      msw.get('*/api/usuarios/me/dados', () => HttpResponse.json({ status: 500, mensagem: 'x' }, { status: 500 })),
    )
    await usuario.click(screen.getByRole('button', { name: /Baixar meus dados/ }))
    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith('Não foi possível baixar seus dados.'))
    clique.mockRestore()
    URL.createObjectURL = original.criar
    URL.revokeObjectURL = original.revogar
  })

  it('exclui a conta: senha incorreta fica no diálogo; deu certo, limpa o cache e vai para "/" com toast', async () => {
    const { usuario, queryClient } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: /Excluir minha conta/ }))
    const dialogo = screen.getByRole('alertdialog', { name: 'Excluir conta' })
    await usuario.type(within(dialogo).getByLabelText('Sua senha'), 'errada')
    await usuario.type(within(dialogo).getByLabelText('Para confirmar, digite EXCLUIR'), 'EXCLUIR')

    acoes.excluirConta.mockResolvedValueOnce({ ok: false, motivo: 'senha-incorreta' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir conta' }))
    expect(await within(dialogo).findByText('Senha incorreta.')).toBeInTheDocument()

    acoes.excluirConta.mockResolvedValueOnce({ ok: false, motivo: 'conexao' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir conta' }))
    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith(expect.stringMatching(/conectar/)))

    acoes.excluirConta.mockResolvedValueOnce({ ok: true })
    const limpar = vi.spyOn(queryClient, 'clear')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir conta' }))
    await waitFor(() => expect(rota.replace).toHaveBeenCalledWith('/'))
    expect(acoes.excluirConta).toHaveBeenLastCalledWith({ senha: 'errada' })
    expect(limpar).toHaveBeenCalled()
    expect(avisos.success).toHaveBeenCalledWith('Sua conta foi excluída.')
  })

  it('cancelar o diálogo fecha; "Sair da conta" chama o logout', async () => {
    const { usuario } = renderizar()
    await usuario.click(await screen.findByRole('button', { name: /Excluir minha conta/ }))
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())

    await usuario.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(acoes.logout).toHaveBeenCalled()
  })

  it('sem conexão: faixa de aviso e os botões que gravam desabilitados com o motivo', async () => {
    definirOnline(false)
    renderizar()
    expect(await screen.findByText(/Sem internet agora/)).toBeInTheDocument()
    const salvar = await screen.findByRole('button', { name: 'Salvar nome' })
    expect(salvar).toBeDisabled()
    expect(salvar).toHaveAccessibleDescription(/Sem internet\. O que você preencheu/)
    expect(screen.getByRole('button', { name: 'Alterar senha' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Excluir minha conta/ })).toBeDisabled()
  })

  it('o esqueleto e o Context fora do Provider', () => {
    render(<PerfilSkeleton />)
    expect(screen.getByLabelText('Carregando o perfil')).toBeInTheDocument()

    vi.spyOn(console, 'error').mockImplementation(() => {})
    function SemProvider() {
      usePerfilContext()
      return null
    }
    expect(() => render(<SemProvider />)).toThrow(/<PerfilProvider>/)
  })
})
