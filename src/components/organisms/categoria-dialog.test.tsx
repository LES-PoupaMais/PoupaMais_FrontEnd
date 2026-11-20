import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CategoriaDialog, type CategoriaDialogProps } from './categoria-dialog'

const mercado = { id: 2, descricao: 'Mercado', ativa: true }

function renderizar(props: Partial<CategoriaDialogProps> = {}) {
  const onSalvar = vi.fn()
  const onAbertoChange = vi.fn()
  render(<CategoriaDialog aberto onAbertoChange={onAbertoChange} onSalvar={onSalvar} {...props} />)
  return { onSalvar, onAbertoChange, usuario: userEvent.setup() }
}

describe('CategoriaDialog', () => {
  it('nova: valida o nome e envia sem espaços nas pontas', async () => {
    const { onSalvar, usuario } = renderizar()
    expect(screen.getByRole('dialog', { name: 'Nova categoria' })).toBeInTheDocument()
    expect(screen.getByText('Ela aparece na hora para escolher nos lançamentos.')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Criar categoria' }))
    expect(screen.getByText('Informe o nome da categoria.')).toBeInTheDocument()
    expect(onSalvar).not.toHaveBeenCalled()

    await usuario.type(screen.getByLabelText(/Nome/), '  Assinaturas  ')
    await usuario.click(screen.getByRole('button', { name: 'Criar categoria' }))
    expect(onSalvar).toHaveBeenCalledWith('Assinaturas')
  })

  it('mostra o erro da API no campo até a pessoa mudar o nome', async () => {
    const { usuario } = renderizar({ nomeInicial: 'Mercado', erroNome: 'Já existe uma categoria com essa descrição.' })
    // antes de enviar, o erro não aparece
    expect(screen.queryByText('Já existe uma categoria com essa descrição.')).toBeNull()

    await usuario.click(screen.getByRole('button', { name: 'Criar categoria' }))
    expect(screen.getByText('Já existe uma categoria com essa descrição.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome/)).toHaveAttribute('aria-invalid', 'true')

    await usuario.type(screen.getByLabelText(/Nome/), 's')
    expect(screen.queryByText('Já existe uma categoria com essa descrição.')).toBeNull()
  })

  it('editar: começa com o nome, inativa e exclui', async () => {
    const onInativar = vi.fn()
    const onExcluir = vi.fn()
    const { onSalvar, usuario } = renderizar({ categoria: mercado, onInativar, onExcluir })

    expect(screen.getByRole('dialog', { name: 'Editar categoria' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome/)).toHaveValue('Mercado')
    await usuario.click(screen.getByRole('button', { name: 'Inativar categoria' }))
    await usuario.click(screen.getByRole('button', { name: 'Excluir categoria' }))
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onInativar).toHaveBeenCalledOnce()
    expect(onExcluir).toHaveBeenCalledOnce()
    expect(onSalvar).toHaveBeenCalledWith('Mercado')
  })

  it('em uso: troca as ações pelo aviso com a mensagem da API e "Inativar categoria"', async () => {
    const onInativar = vi.fn()
    const avisoEmUso = 'Categoria vinculada a lançamentos, apenas inative'
    const { usuario } = renderizar({ categoria: mercado, onInativar, onExcluir: vi.fn(), avisoEmUso })

    expect(screen.getByRole('status')).toHaveTextContent(avisoEmUso)
    expect(screen.queryByRole('button', { name: 'Excluir categoria' })).toBeNull()
    await usuario.click(screen.getByRole('button', { name: 'Inativar categoria' }))
    expect(onInativar).toHaveBeenCalledOnce()
  })

  it('Cancelar fecha', async () => {
    const { onAbertoChange, usuario } = renderizar()
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onAbertoChange).toHaveBeenCalledWith(false)
  })

  it('enquanto salva, Esc não fecha e Cancelar fica desabilitado', async () => {
    const { onAbertoChange, usuario } = renderizar({ salvando: true })
    await usuario.keyboard('{Escape}')
    expect(onAbertoChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('sem conexão, não grava e mostra o motivo', async () => {
    const onInativar = vi.fn()
    const { onSalvar, usuario } = renderizar({ categoria: mercado, onInativar, semConexao: true })

    await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
    await usuario.click(screen.getByRole('button', { name: 'Inativar categoria' }))

    expect(onSalvar).not.toHaveBeenCalled()
    expect(onInativar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/Sem internet/)).toBeInTheDocument()
  })

  it('aceita texto, rótulo e ajuda próprios (criar pelo campo do formulário)', () => {
    renderizar({
      texto: 'Você digitou "Farmácia" na busca.',
      rotuloNome: 'Nome da categoria',
      ajuda: 'Ela já entra escolhida neste lançamento.',
      nomeInicial: 'Farmácia',
    })
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Você digitou "Farmácia" na busca.')
    expect(screen.getByLabelText(/Nome da categoria/)).toHaveValue('Farmácia')
    expect(screen.getByText('Ela já entra escolhida neste lançamento.')).toBeInTheDocument()
  })
})
