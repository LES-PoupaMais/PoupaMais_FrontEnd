import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NovaCategoriaDialog, type NovaCategoriaDialogProps } from './nova-categoria-dialog'

const renderizar = (props: Partial<NovaCategoriaDialogProps> = {}) => {
  const onCriar = vi.fn()
  const onCancelar = vi.fn()
  render(<NovaCategoriaDialog aberto onCriar={onCriar} onCancelar={onCancelar} {...props} />)
  return { onCriar, onCancelar, usuario: userEvent.setup() }
}

describe('NovaCategoriaDialog', () => {
  it('fechado não mostra nada', () => {
    render(<NovaCategoriaDialog aberto={false} onCriar={vi.fn()} onCancelar={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('traz o texto da busca e cria com o nome sem espaços nas pontas', async () => {
    const { onCriar, usuario } = renderizar({ nomeInicial: 'Farmácia' })

    expect(screen.getByRole('dialog', { name: 'Nova categoria' })).toBeInTheDocument()
    expect(screen.getByText('Você digitou "Farmácia" na busca. Confira o nome antes de criar.')).toBeInTheDocument()
    expect(screen.getByText('Ela já entra escolhida neste lançamento.')).toBeInTheDocument()
    const campo = screen.getByLabelText(/Nome da categoria/)
    await usuario.clear(campo)
    await usuario.type(campo, '  Farmácia  ')
    await usuario.click(screen.getByRole('button', { name: 'Criar categoria' }))

    expect(onCriar).toHaveBeenCalledWith('Farmácia')
  })

  it('sem nome não cria', async () => {
    const { onCriar, usuario } = renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Criar categoria' }))
    expect(await screen.findByText('Informe o nome da categoria.')).toBeInTheDocument()
    expect(onCriar).not.toHaveBeenCalled()
  })

  it('mostra o erro da API no campo e Cancelar fecha', async () => {
    const { onCancelar, usuario } = renderizar({
      nomeInicial: 'mercado',
      erro: 'Já existe uma categoria com esse nome',
    })

    expect(await screen.findByText('Já existe uma categoria com esse nome')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalled()
  })

  it('criando: botão ocupado', () => {
    renderizar({ enviando: true, nomeInicial: 'x' })
    expect(screen.getByRole('button', { name: 'Criar categoria' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
