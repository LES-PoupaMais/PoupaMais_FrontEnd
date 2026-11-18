import * as React from 'react'
import { cn } from '@/lib/cn'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // PoupaMais: campo do Design System (44px, raio-campo, borda-campo de 1,5px; erro com fundo erro-fundo)
        'rounded-campo border-input bg-card text-corpo text-foreground placeholder:text-muted-foreground not-disabled:not-aria-invalid:hover:border-muted-foreground focus-visible:border-primary aria-invalid:border-destructive aria-invalid:bg-erro-fundo disabled:border-border disabled:bg-secondary disabled:text-muted-foreground read-only:border-border read-only:bg-secondary file:text-foreground h-11 w-full min-w-0 border-[1.5px] px-3 transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
