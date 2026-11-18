'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { CheckIcon } from 'lucide-react'

// PoupaMais: switch do Design System ("Conta no saldo"): trilho de 52 × 30px (borda-campo desligado, primária ligado), bolinha de
// 24px com ✓ quando ligado (o estado não depende só da cor) e alvo de 52 × 44px. O tamanho `sm` do shadcn foi retirado.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer group/switch rounded-pilula bg-input data-checked:bg-primary relative inline-flex h-[30px] w-[52px] shrink-0 items-center p-[3px] transition-colors after:absolute after:inset-x-0 after:-inset-y-[7px] not-disabled:hover:shadow-[0_0_0_4px_var(--secondary)] disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-card text-primary data-checked:bg-primary-foreground pointer-events-none grid size-6 place-items-center rounded-full shadow-[0_1px_2px_var(--sobreposicao)] transition-transform duration-200 data-checked:translate-x-[22px]"
      >
        <CheckIcon
          className="size-3.5 stroke-3 opacity-0 transition-opacity group-data-[state=checked]/switch:opacity-100"
          aria-hidden="true"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
