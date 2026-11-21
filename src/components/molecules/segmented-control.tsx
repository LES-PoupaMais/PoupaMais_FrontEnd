'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import { MensagemErro, juntarIds } from '@/components/molecules/form-field'
import { cn } from '@/lib/cn'

// Seletor segmentado do Design System (components/SegmentedControl): escolha única entre 2 e 4 opções curtas numa pílula.
// Sobre o RadioGroup do Radix: role="radiogroup", cada opção role="radio" com aria-checked, Tab entra na escolhida e as
// setas trocam. A opção com `funcao` "receita"/"despesa" ganha a cor do tipo SÓ quando escolhida, sempre com a seta.

export type OpcaoSegmentada<T extends string> = {
  value: T
  label: ReactNode
  icon?: ReactNode
  /** Cor e seta do tipo de lançamento (Receita/Despesa) */
  funcao?: 'receita' | 'despesa'
  disabled?: boolean
}

export type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<OpcaoSegmentada<T>>
  /** Opção escolhida; null = nenhuma (o Novo lançamento não pré-escolhe o tipo) */
  value: T | null
  onChange: (valor: T) => void
  /** Rótulo visível acima da pílula; sem ele, passe `aria-label` */
  label?: ReactNode
  'aria-label'?: string
  /** Largura total, opções divididas por igual */
  bloco?: boolean
  /** Com `bloco`: opções que encolhem (base 0, 8px de respiro, 6px entre ícone e texto), para três opções com ícone
   * caberem no card do celular (tema do Perfil, prancheta perfil-celular) */
  compacto?: boolean
  error?: string | null
  required?: boolean
  disabled?: boolean
  name?: string
  className?: string
}

const SETAS = { receita: ArrowUpRight, despesa: ArrowDownRight } as const

const COR_ESCOLHIDA = {
  neutra:
    'data-[state=checked]:border-border data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-card',
  receita:
    'data-[state=checked]:border-receita data-[state=checked]:bg-receita-fundo data-[state=checked]:text-receita',
  despesa:
    'data-[state=checked]:border-despesa data-[state=checked]:bg-despesa-fundo data-[state=checked]:text-despesa',
} as const

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  'aria-label': ariaLabel,
  bloco = false,
  compacto = false,
  error,
  required = false,
  disabled = false,
  name,
  className,
}: SegmentedControlProps<T>) {
  const base = useId()
  const rotuloId = `${base}-rotulo`
  const erroId = `${base}-erro`

  return (
    <div data-slot="segmented-control" className={cn('flex flex-col gap-1.5', bloco && 'w-full', className)}>
      {label && (
        <span id={rotuloId} className="text-rotulo-campo text-foreground">
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      <RadioGroup.Root
        value={value ?? ''}
        onValueChange={(v) => onChange(v as T)}
        orientation="horizontal"
        loop
        name={name}
        required={required}
        disabled={disabled}
        aria-labelledby={label ? rotuloId : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={juntarIds(error && erroId)}
        className={cn(
          'bg-secondary rounded-pilula inline-flex max-w-full [scrollbar-width:none] gap-1 overflow-x-auto p-1',
          bloco && 'flex w-full',
          error && 'shadow-[inset_0_0_0_1.5px_var(--destructive)]',
        )}
      >
        {options.map((opcao) => {
          const Seta = opcao.funcao ? SETAS[opcao.funcao] : null
          return (
            <RadioGroup.Item
              key={opcao.value}
              value={opcao.value}
              disabled={opcao.disabled}
              className={cn(
                'text-muted-foreground hover:text-foreground rounded-pilula inline-flex min-h-10 items-center justify-center gap-2 border-[1.5px] border-transparent px-4 text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45 data-[state=checked]:font-bold',
                COR_ESCOLHIDA[opcao.funcao ?? 'neutra'],
                bloco && 'flex-1',
                bloco && compacto && 'min-w-0 basis-0 gap-1.5 px-2',
              )}
            >
              {Seta ? <Seta className="size-5" aria-hidden="true" /> : opcao.icon}
              {opcao.label}
            </RadioGroup.Item>
          )
        })}
      </RadioGroup.Root>
      {error && <MensagemErro id={erroId}>{error}</MensagemErro>}
    </div>
  )
}
