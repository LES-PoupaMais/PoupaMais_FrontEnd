import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

// PoupaMais: formas do Design System (Skeleton / `.pm-skeleton`) com as mesmas medidas do conteúdo real
// (texto 14px, título 22px, valor 30px, ícone 40px) e `claro` para dentro do card de destaque (currentColor suave).
// Com `prefers-reduced-motion` o globals.css zera a animação: os blocos ficam parados.
const skeletonVariants = cva('block animate-pulse rounded-sm bg-secondary', {
  variants: {
    forma: {
      livre: '',
      texto: 'h-3.5',
      titulo: 'h-5.5',
      valor: 'h-7.5',
      icone: 'size-10 shrink-0 rounded-icone',
    },
    claro: { true: 'bg-current opacity-16' },
  },
  defaultVariants: { forma: 'livre' },
})

type SkeletonProps = React.ComponentProps<'div'> & VariantProps<typeof skeletonVariants>

function Skeleton({ className, forma, claro, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ forma, claro }), className)}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
export type { SkeletonProps }
