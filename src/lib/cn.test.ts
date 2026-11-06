import { expect, it } from 'vitest'
import { cn } from './cn'

it('junta classes, ignora valores falsos e resolve conflitos do Tailwind', () => {
  expect(cn('px-2', false, undefined, 'py-1', 'px-4')).toBe('py-1 px-4')
})
