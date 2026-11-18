import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Circle, Wallet, type LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/cn'

// Ícone de função do Design System (FunctionIcon / `.pm-icone-funcao`): quadrado de 40px, raio 12px, fundo `<funcao>-fundo`
// e ícone na cor da função. Decorativo: o tipo precisa estar no texto vizinho (a cor nunca é a única pista).
// `investimento` e `compartilhado` são reservados (não use nas telas da entrega atual).
const functionIconVariants = cva('inline-grid shrink-0 place-items-center', {
  variants: {
    funcao: {
      receita: 'bg-receita-fundo text-receita',
      despesa: 'bg-despesa-fundo text-despesa',
      primaria: 'bg-accent text-primary',
      neutro: 'bg-secondary text-foreground',
      investimento: 'bg-investimento-fundo text-investimento',
      compartilhado: 'bg-compartilhado-fundo text-compartilhado',
    },
    tamanho: {
      20: 'size-10 rounded-icone [&>svg]:size-5',
      // card grande e estado vazio: caixa de 56px com o raio do card
      24: 'size-14 rounded-card [&>svg]:size-6',
    },
  },
  defaultVariants: { funcao: 'neutro', tamanho: 20 },
})

type Funcao = NonNullable<VariantProps<typeof functionIconVariants>['funcao']>

const ICONE_PADRAO: Record<Funcao, LucideIcon> = {
  receita: ArrowUpRight,
  despesa: ArrowDownRight,
  primaria: Wallet,
  neutro: Circle,
  investimento: Circle,
  compartilhado: Circle,
}

type FunctionIconProps = Omit<React.ComponentProps<'span'>, 'children'> &
  VariantProps<typeof functionIconVariants> & {
    /** Ícone Lucide. Padrão: receita ArrowUpRight, despesa ArrowDownRight, primária Wallet (neutro: passe o do contexto) */
    icone?: LucideIcon
  }

function FunctionIcon({ funcao = 'neutro', tamanho = 20, icone, className, ...props }: FunctionIconProps) {
  const Icone = icone ?? ICONE_PADRAO[funcao ?? 'neutro']

  return (
    <span
      data-slot="function-icon"
      data-funcao={funcao}
      aria-hidden="true"
      className={cn(functionIconVariants({ funcao, tamanho }), className)}
      {...props}
    >
      <Icone strokeWidth={2} aria-hidden="true" focusable="false" />
    </span>
  )
}

export { FunctionIcon, functionIconVariants }
export type { FunctionIconProps, Funcao }
