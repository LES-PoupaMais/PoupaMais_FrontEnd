import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FotoPerfil } from './foto-perfil'

const base = { nome: 'Leonardo Nascimento', onEscolherArquivo: vi.fn(), onRemover: vi.fn() }

describe('FotoPerfil', () => {
  it('sem foto: inicial, "Enviar foto" e sem "Remover foto"', () => {
    render(<FotoPerfil {...base} fotoUrl={null} />)
    expect(screen.getByRole('img', { name: 'Avatar de Leonardo Nascimento' })).toHaveTextContent('L')
    expect(screen.getByLabelText('Enviar foto')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    expect(screen.queryByRole('button', { name: 'Remover foto' })).not.toBeInTheDocument()
    expect(screen.getByText('JPG, PNG ou WEBP até 2 MB.')).toBeInTheDocument()
  })

  it('com foto: escolher um arquivo entrega o File e remover chama onRemover', async () => {
    const onEscolherArquivo = vi.fn()
    const onRemover = vi.fn()
    render(
      <FotoPerfil
        {...base}
        fotoUrl="/api/usuarios/me/foto?v=1"
        onEscolherArquivo={onEscolherArquivo}
        onRemover={onRemover}
      />,
    )
    const foto = new File(['x'], 'eu.png', { type: 'image/png' })

    await userEvent.upload(screen.getByLabelText('Trocar foto'), foto)
    expect(onEscolherArquivo).toHaveBeenCalledWith(foto)

    await userEvent.click(screen.getByRole('button', { name: 'Remover foto' }))
    expect(onRemover).toHaveBeenCalled()
  })

  it('enviando: spinner no avatar, botão "Enviando…" desabilitado e aviso', () => {
    render(<FotoPerfil {...base} fotoUrl="/f" enviando />)
    expect(screen.getByRole('img', { name: 'Enviando foto' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Enviando a foto…')
    expect(screen.getByRole('region', { name: 'Foto de perfil, enviando' })).toBeInTheDocument()
  })

  it('erro: mensagem em alerta ligada ao campo', () => {
    render(<FotoPerfil {...base} fotoUrl={null} erro="A foto deve ter no máximo 2 MB. Escolha uma imagem menor." />)
    expect(screen.getByRole('alert')).toHaveTextContent('A foto deve ter no máximo 2 MB.')
    expect(screen.getByLabelText('Enviar foto')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sem conexão: botões desabilitados com o motivo', () => {
    render(<FotoPerfil {...base} fotoUrl="/f" bloqueado idMotivo="motivo" />)
    expect(screen.getByLabelText('Trocar foto')).toBeDisabled()
    expect(screen.getByLabelText('Trocar foto').getAttribute('aria-describedby')).toContain('motivo')
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeDisabled()
  })
})
