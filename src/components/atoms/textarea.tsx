import * as React from 'react'
import { cn } from '@/lib/cn'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // PoupaMais: mesmo visual do campo do Design System, com altura mínima e crescimento pelo conteúdo
        'rounded-campo border-input bg-card text-corpo text-foreground placeholder:text-muted-foreground not-disabled:not-aria-invalid:hover:border-muted-foreground focus-visible:border-primary aria-invalid:border-destructive aria-invalid:bg-erro-fundo disabled:border-border disabled:bg-secondary disabled:text-muted-foreground read-only:border-border read-only:bg-secondary flex field-sizing-content min-h-24 w-full min-w-0 border-[1.5px] px-3 py-2.5 transition-colors disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
