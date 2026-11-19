import type { LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { cn } from '@/lib/cn'

// EmptyState do Design System: explica por que não há nada e oferece o próximo passo.
// Ícone num quadrado de 56px (primária só no primeiro uso; neutro nos demais), título (heading), texto e 0 a 3 ações.
// Um botão preenchido por tela: só o primeiro uso tem primário; nos demais, contornado ou texto.
// Ações são links quando levam a outra tela e botões quando agem na mesma (quem usa decide e passa os elementos prontos).

type EmptyStateProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  icone: LucideIcon
  funcao?: 'primaria' | 'neutro'
  titulo: string
  texto?: React.ReactNode
  /** Botões/links prontos (0 a 3) */
  acoes?: React.ReactNode
  /** Ações empilhadas (primeiro uso no celular) */
  acoesEmColuna?: boolean
  /** Nível do título na página */
  nivel?: 'h2' | 'h3'
  /** `grande` = card grande (raio 24px); `sem-cartao` quando já está dentro de um card */
  superficie?: 'cartao' | 'grande' | 'sem-cartao'
}

const SUPERFICIE = {
  cartao: 'rounded-card border border-border bg-card text-card-foreground shadow-card',
  grande: 'rounded-grande border border-border bg-card text-card-foreground shadow-card',
  'sem-cartao': '',
} as const

function EmptyState({
  icone,
  funcao = 'neutro',
  titulo,
  texto,
  acoes,
  acoesEmColuna = false,
  nivel: Titulo = 'h2',
  superficie = 'cartao',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <section
      data-slot="empty-state"
      className={cn('flex flex-col items-center gap-3 px-5 py-8 text-center', SUPERFICIE[superficie], className)}
      {...props}
    >
      <FunctionIcon funcao={funcao} icone={icone} tamanho={24} />
      <Titulo className="text-titulo-3 max-w-[32ch]">{titulo}</Titulo>
      {texto && <p className="text-corpo text-muted-foreground max-w-[40ch]">{texto}</p>}
      {acoes && (
        <div
          data-slot="empty-state-acoes"
          className={cn(
            'mt-2 flex flex-wrap justify-center gap-3',
            acoesEmColuna && 'w-full max-w-80 flex-col items-stretch',
          )}
        >
          {acoes}
        </div>
      )}
    </section>
  )
}

export { EmptyState }
export type { EmptyStateProps }
