import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toaster } from './sonner'

// O sonner captura o ponteiro ao tocar no toast (arrastar para dispensar); o jsdom não tem setPointerCapture
Element.prototype.setPointerCapture ??= vi.fn()
Element.prototype.releasePointerCapture ??= vi.fn()

// Toaster com o visual do Toast do DS: fonte do app, × "Fechar aviso", ação como texto e caixa só nos toasts com tipo
describe('Toaster', () => {
  afterEach(() => {
    act(() => toast.dismiss())
  })

  it('usa a fonte do app e mostra o × "Fechar aviso" no toast de sucesso', async () => {
    const { container } = render(<Toaster />)
    act(() => {
      toast.success('Lançamento salvo')
    })

    expect(await screen.findByText('Lançamento salvo')).toBeInTheDocument()
    expect(container.querySelector('[data-sonner-toaster]')?.getAttribute('style')).toContain(
      'font-family: var(--font-sans)',
    )
    const item = screen.getByText('Lançamento salvo').closest('[data-sonner-toast]')
    expect(item).toHaveAttribute('data-type', 'success')
    expect(item).toHaveClass('not-has-[[data-slot=undo-toast]]:border-border')
    await userEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))
    await vi.waitFor(() => expect(screen.queryByText('Lançamento salvo')).toBeNull())
  })

  it('erro com ação em texto (sem ×) e a borda de erro', async () => {
    const tentar = vi.fn()
    render(<Toaster />)
    act(() => {
      toast.error('Não foi possível salvar.', {
        closeButton: false,
        action: { label: 'Tentar de novo', onClick: tentar },
      })
    })

    const item = (await screen.findByText('Não foi possível salvar.')).closest('[data-sonner-toast]')
    expect(item).toHaveClass('not-has-[[data-slot=undo-toast]]:border-destructive')
    expect(screen.queryByRole('button', { name: 'Fechar aviso' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(tentar).toHaveBeenCalled()
  })
})
