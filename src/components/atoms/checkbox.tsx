'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { CheckIcon } from 'lucide-react'

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // PoupaMais: caixa de 22px do Design System (raio-sm, borda-campo 1,5px, ✓ sobre primária, erro com erro-fundo); after: amplia o alvo para 44px
        'peer border-input bg-card text-primary-foreground not-disabled:hover:border-muted-foreground aria-invalid:border-destructive aria-invalid:bg-erro-fundo data-checked:border-primary data-checked:bg-primary data-checked:hover:border-primary disabled:border-border disabled:bg-secondary disabled:data-checked:border-input disabled:data-checked:bg-input disabled:data-checked:text-card relative flex size-[22px] shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-colors after:absolute after:-inset-[11px] disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-4 [&>svg]:stroke-3"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
