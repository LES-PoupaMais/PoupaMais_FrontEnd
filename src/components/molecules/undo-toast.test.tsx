import { act, fireEvent, render, screen } from '@testing-library/react'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UndoToast, mostrarToastDesfazer } from './undo-toast'

describe('UndoToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('conta 5 s e chama onExpirar uma vez quando o tempo acaba', () => {
    const onExpirar = vi.fn()
    render(<UndoToast mensagem="Movido para a lixeira" onDesfazer={vi.fn()} onExpirar={onExpirar} />)
    expect(screen.getByRole('status')).toHaveTextContent('Movido para a lixeira')
    expect(screen.getByText('5 s')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1100))
    expect(screen.getByText('4 s')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(4000))
    expect(onExpirar).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(onExpirar).toHaveBeenCalledTimes(1)
  })

  it('para o tempo com o mouse em cima e Desfazer não deixa expirar', () => {
    const onExpirar = vi.fn()
    const onDesfazer = vi.fn()
    render(<UndoToast mensagem="Apagado" duracaoMs={1000} onDesfazer={onDesfazer} onExpirar={onExpirar} />)
    const toast = screen.getByRole('status')
    fireEvent.mouseEnter(toast)
    act(() => vi.advanceTimersByTime(3000))
    expect(onExpirar).not.toHaveBeenCalled()
    fireEvent.focus(screen.getByRole('button', { name: 'Desfazer' }))
    fireEvent.mouseLeave(toast)
    act(() => vi.advanceTimersByTime(3000))
    expect(onExpirar).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(onDesfazer).toHaveBeenCalled()
    fireEvent.blur(screen.getByRole('button', { name: 'Desfazer' }))
    act(() => vi.advanceTimersByTime(3000))
    expect(onExpirar).not.toHaveBeenCalled()
  })

  it('mostrarToastDesfazer: Desfazer chama só onDesfazer; o tempo acabando chama só onFechar', async () => {
    render(<Toaster />)
    const onDesfazer = vi.fn()
    const onFechar = vi.fn()
    act(() => {
      mostrarToastDesfazer({ mensagem: 'Primeiro', onDesfazer, onFechar })
    })
    fireEvent.click(await vi.waitFor(() => screen.getByRole('button', { name: 'Desfazer' })))
    expect(onDesfazer).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(onFechar).not.toHaveBeenCalled()

    const onFechar2 = vi.fn()
    act(() => {
      mostrarToastDesfazer({ mensagem: 'Segundo', duracaoMs: 500, onDesfazer: vi.fn(), onFechar: onFechar2 })
    })
    act(() => vi.advanceTimersByTime(800))
    expect(onFechar2).toHaveBeenCalledTimes(1)
  })
})
