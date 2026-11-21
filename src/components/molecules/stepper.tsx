import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// Indicador de passos do Design System (components/Stepper), genérico: "Passo 2 de 3" acima de uma barra por etapa.
// Feito = barra primária + nome com ✓ (e "(concluído)" para o leitor de tela); atual = barra e nome em primária,
// aria-current="step"; a fazer = barra superfície-2. Rodapé opcional: "Voltar" contornado e a ação preenchida à direita.
// Ao trocar de passo, quem usa leva o foco ao título do novo passo.

export type StepperProps = {
  /** Nomes curtos (uma palavra), de 3 a 5 */
  passos: ReadonlyArray<string>
  /** Índice do passo atual (começa em 0) */
  atual: number
  onVoltar?: () => void
  onContinuar?: () => void
  /** Texto do botão final ("Continuar", "Importar") */
  rotuloContinuar?: ReactNode
  continuarCarregando?: boolean
  continuarDesabilitado?: boolean
  className?: string
}

export function Stepper({
  passos,
  atual,
  onVoltar,
  onContinuar,
  rotuloContinuar = 'Continuar',
  continuarCarregando = false,
  continuarDesabilitado = false,
  className,
}: StepperProps) {
  const indice = Math.min(Math.max(atual, 0), passos.length - 1)
  return (
    <div data-slot="stepper" className={cn('flex flex-col gap-3', className)}>
      <p className="text-legenda text-muted-foreground font-semibold">
        Passo {indice + 1} de {passos.length}
      </p>
      <nav aria-label="Progresso">
        <ol className="grid auto-cols-fr grid-flow-col gap-2">
          {passos.map((nome, i) => {
            const feito = i < indice
            const corrente = i === indice
            return (
              <li key={nome} aria-current={corrente ? 'step' : undefined} className="flex min-w-0 flex-col gap-2">
                <span
                  aria-hidden="true"
                  className={cn('rounded-pilula h-1.5', feito || corrente ? 'bg-primary' : 'bg-secondary')}
                />
                <span
                  className={cn(
                    'text-legenda flex items-center gap-1 truncate font-semibold',
                    feito ? 'text-foreground' : corrente ? 'text-primary font-bold' : 'text-muted-foreground',
                  )}
                >
                  {feito && <Check className="size-4 shrink-0 stroke-[2.5]" aria-hidden="true" />}
                  <span className="truncate">{nome}</span>
                  {feito && <span className="sr-only"> (concluído)</span>}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
      {(onVoltar || onContinuar) && (
        <div className="mt-2 flex flex-wrap justify-between gap-3">
          {onVoltar ? (
            <Button variant="contornado" onClick={onVoltar} disabled={indice === 0}>
              Voltar
            </Button>
          ) : (
            <span />
          )}
          {onContinuar && (
            <Button onClick={onContinuar} loading={continuarCarregando} disabled={continuarDesabilitado}>
              {rotuloContinuar}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
