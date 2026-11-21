import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

// o jsdom não tem ResizeObserver (o Radix mede o gatilho para posicionar o balão)
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function Exemplo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger aria-label="O que é Conta no saldo?">i</TooltipTrigger>
        <TooltipContent>
          Desligado: o lançamento continua na lista, mas não entra no saldo nem no dashboard.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe('Tooltip', () => {
  it('abre no foco do teclado e fecha com Esc', async () => {
    const usuario = userEvent.setup()
    render(<Exemplo />)

    await usuario.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/continua na lista/)

    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
