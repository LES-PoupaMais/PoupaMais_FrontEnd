import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Checkbox } from './checkbox'
import { Input } from './input'
import { Label } from './label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Switch } from './switch'
import { Textarea } from './textarea'

// Átomos do shadcn com o visual do Design System (alterados com `// PoupaMais:`): comportamento por props.

// O Select do Radix usa captura de ponteiro e scrollIntoView, que o jsdom não tem.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

describe('átomos de formulário', () => {
  it('Input e Textarea ligados ao Label', async () => {
    render(
      <>
        <Label htmlFor="d">Descrição</Label>
        <Input id="d" aria-invalid />
        <Label htmlFor="o">Observação</Label>
        <Textarea id="o" readOnly value="texto" />
      </>,
    )

    await userEvent.type(screen.getByRole('textbox', { name: 'Descrição' }), 'Mercado')
    expect(screen.getByRole('textbox', { name: 'Descrição' })).toHaveValue('Mercado')
    expect(screen.getByRole('textbox', { name: 'Observação' })).toHaveAttribute('readonly')
  })

  it('Checkbox marca pelo rótulo e mostra o ✓', async () => {
    const aoMudar = vi.fn()
    render(
      <label>
        <Checkbox onCheckedChange={aoMudar} /> Li e aceito a Política de Privacidade
      </label>,
    )

    await userEvent.click(screen.getByText(/Li e aceito/))
    expect(aoMudar).toHaveBeenCalledWith(true)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('Switch alterna com ✓ e respeita disabled', async () => {
    const aoMudar = vi.fn()
    const { rerender } = render(<Switch aria-label="Conta no saldo" onCheckedChange={aoMudar} />)

    await userEvent.click(screen.getByRole('switch', { name: 'Conta no saldo' }))
    expect(aoMudar).toHaveBeenCalledWith(true)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')

    rerender(<Switch aria-label="Conta no saldo" disabled onCheckedChange={aoMudar} />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('Select abre e escolhe', async () => {
    const aoMudar = vi.fn()
    render(
      <Select onValueChange={aoMudar}>
        <SelectTrigger aria-label="Formato">
          <SelectValue placeholder="Escolha" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="xlsx">Excel</SelectItem>
        </SelectContent>
      </Select>,
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Formato' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Excel' }))
    expect(aoMudar).toHaveBeenCalledWith('xlsx')
  })

  it('Popover abre o conteúdo', async () => {
    render(
      <Popover>
        <PopoverTrigger>Abrir</PopoverTrigger>
        <PopoverContent aria-label="Painel">Conteúdo</PopoverContent>
      </Popover>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('dialog', { name: 'Painel' })).toHaveTextContent('Conteúdo')
  })
})
