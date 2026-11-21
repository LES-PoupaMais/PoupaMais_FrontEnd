import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet'

// Átomo do shadcn com uma alteração do PoupaMais: `overlayClassName` (o véu usa o token bg-sobreposicao).
describe('Sheet', () => {
  it('abre pelo gatilho, aplica a classe do véu e fecha pelo botão padrão', async () => {
    render(
      <Sheet>
        <SheetTrigger>Abrir</SheetTrigger>
        <SheetContent side="left" overlayClassName="bg-sobreposicao">
          <SheetHeader>
            <SheetTitle>Título</SheetTitle>
            <SheetDescription>Descrição</SheetDescription>
          </SheetHeader>
          <SheetFooter>Rodapé</SheetFooter>
        </SheetContent>
      </Sheet>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    const folha = screen.getByRole('dialog', { name: 'Título' })
    expect(folha).toHaveAttribute('data-side', 'left')
    expect(document.querySelector('[data-slot="sheet-overlay"]')).toHaveClass('bg-sobreposicao')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
