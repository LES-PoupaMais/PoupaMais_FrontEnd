import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Slot } from 'radix-ui'
import { LoaderCircle } from 'lucide-react'

// PoupaMais: botão do Design System (components/Button): pílula de 48px, quatro variantes (primário, contornado, texto e
// perigo) mais "perigo-texto" (ação de exclusão de baixo peso, ex.: "Mover para a lixeira" no detalhe), tamanhos padrao (48px),
// pequeno (36px) e icone (44 × 44). Foco: o anel de 2px vem do globals.css (:focus-visible).
const variantes = {
  primario: 'bg-primary text-primary-foreground hover:bg-primaria-hover',
  contornado: 'border-input bg-transparent text-foreground hover:bg-secondary aria-expanded:bg-secondary',
  texto: 'bg-transparent px-3 text-primary hover:bg-accent',
  perigo: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  'perigo-texto': 'bg-transparent px-3 text-destructive hover:bg-erro-fundo',
  link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
}

const tamanhos = {
  padrao: 'h-12 px-6',
  pequeno: "h-9 px-4 text-legenda font-bold [&_svg:not([class*='size-'])]:size-4",
  icone: 'size-11 bg-transparent p-0 text-foreground hover:bg-secondary',
}

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-pilula border-[1.5px] border-transparent text-corpo-forte whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-45 aria-busy:cursor-progress aria-disabled:cursor-not-allowed aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        ...variantes,
        // PoupaMais: nomes originais do shadcn mantidos como apelidos, porque os átomos gerados pela CLI (dialog,
        // alert-dialog, input-group…) usam esses nomes. Código novo usa os nomes do Design System acima.
        default: variantes.primario,
        outline: variantes.contornado,
        secondary: variantes.contornado,
        ghost: variantes.texto,
        destructive: variantes.perigo,
      },
      size: {
        ...tamanhos,
        // PoupaMais: apelidos dos tamanhos do shadcn, todos levados aos tamanhos do Design System.
        default: tamanhos.padrao,
        lg: tamanhos.padrao,
        xl: tamanhos.padrao,
        sm: tamanhos.pequeno,
        xs: tamanhos.pequeno,
        icon: tamanhos.icone,
        'icon-lg': tamanhos.icone,
        'icon-sm': cn(tamanhos.icone, 'size-9'),
        'icon-xs': cn(tamanhos.icone, 'size-8'),
      },
    },
    defaultVariants: {
      variant: 'primario',
      size: 'padrao',
    },
  },
)

// PoupaMais: prop `loading` (spinner, aria-busy e aria-disabled: mantém o foco no botão, mas ignora novos cliques e não
// envia o formulário de novo — RNF006) e type="button" por padrão.
type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

function Button({
  className,
  variant = 'primario',
  size = 'padrao',
  asChild = false,
  loading = false,
  type,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  const aoClicar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      evento.preventDefault()
      return
    }
    onClick?.(evento)
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(asChild ? {} : { type: type ?? 'button' })}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={aoClicar}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
