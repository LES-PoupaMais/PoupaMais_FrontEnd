import { expect, it } from 'vitest'
import { cn } from './cn'

it('junta classes, ignora valores falsos e resolve conflitos do Tailwind', () => {
  expect(cn('px-2', false, undefined, 'py-1', 'px-4')).toBe('py-1 px-4')
})

it('entende os tokens do Design System: estilo de texto não apaga a cor e vice-versa', () => {
  expect(cn('text-receita text-valor-destaque')).toBe('text-receita text-valor-destaque')
  expect(cn('text-receita', 'text-muted-foreground')).toBe('text-muted-foreground')
  expect(cn('text-titulo-1', 'text-titulo-2')).toBe('text-titulo-2')
  expect(cn('shadow-card', 'shadow-flutuante')).toBe('shadow-flutuante')
  expect(cn('shadow-card bg-card')).toBe('shadow-card bg-card')
  expect(cn('rounded-card', 'rounded-grande')).toBe('rounded-grande')
  expect(cn('w-trilho', 'w-sidebar')).toBe('w-sidebar')
})
