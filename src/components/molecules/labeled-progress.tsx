import { CircleAlert, CircleCheck } from 'lucide-react'
import * as React from 'react'
import { Progress, type ProgressProps } from '@/components/atoms/progress'
import { cn } from '@/lib/cn'
import { formatarSaldo, somarValores, type ValorMonetario } from '@/lib/format'

// ProgressBar do Design System: título, "R$ 680,00 de R$ 1.000,00", barra e o texto de situação (que carrega o sentido).
// Em andamento → "Faltam R$ 320,00" (primária); completo → "Fechou 100%" (receita, CircleCheck);
// passou do total → "Passou R$ 45,00 do total" (despesa, CircleAlert). Textos neutros, sem conselho.

type Cor = NonNullable<ProgressProps['cor']>

type LabeledProgressProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  titulo: string
  atual: ValorMonetario
  total: ValorMonetario
  /** Texto de situação próprio (substitui o calculado) */
  status?: string
  /** Cor própria (substitui a calculada pela situação) */
  cor?: Cor
}

const COR_DO_STATUS: Record<Cor, string> = {
  primaria: 'text-foreground',
  receita: 'text-receita',
  atencao: 'text-atencao',
  despesa: 'text-despesa',
  investimento: 'text-investimento',
  compartilhado: 'text-compartilhado',
  destaque: 'text-destaque',
}

function situacao(atual: number, total: number) {
  const diferenca = somarValores([total, -atual])
  if (diferenca > 0) {
    const falta = formatarSaldo(diferenca)
    const pct = total > 0 ? Math.floor((atual / total) * 100) : 0
    return { cor: 'primaria' as const, texto: `Faltam ${falta}`, leitura: `${pct}%, faltam ${falta}`, Icone: null }
  }
  if (diferenca === 0) {
    return { cor: 'receita' as const, texto: 'Fechou 100%', leitura: '100%, completo', Icone: CircleCheck }
  }
  const passou = formatarSaldo(-diferenca)
  return {
    cor: 'despesa' as const,
    texto: `Passou ${passou} do total`,
    leitura: `Passou do total em ${passou}`,
    Icone: CircleAlert,
  }
}

function LabeledProgress({ titulo, atual, total, status, cor, className, ...props }: LabeledProgressProps) {
  const idTitulo = React.useId()
  const nAtual = Number(atual)
  const nTotal = Number(total)
  const calculada = situacao(nAtual, nTotal)
  const corFinal = cor ?? calculada.cor
  const texto = status ?? calculada.texto
  const leitura = status ?? calculada.leitura
  const pct = nTotal > 0 ? (nAtual / nTotal) * 100 : 0

  return (
    <div data-slot="labeled-progress" className={cn('flex flex-col gap-2', className)} {...props}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p id={idTitulo} className="text-corpo-forte">
          {titulo}
        </p>
        <p className="text-legenda text-muted-foreground tabular-nums">
          {formatarSaldo(atual)} de {formatarSaldo(total)}
        </p>
      </div>
      <Progress valor={pct} cor={corFinal} aria-labelledby={idTitulo} textoValor={leitura} />
      <p className={cn('text-legenda flex items-center gap-1 font-bold tabular-nums', COR_DO_STATUS[corFinal])}>
        {!status && calculada.Icone && <calculada.Icone className="size-4 shrink-0" aria-hidden="true" />}
        {texto}
      </p>
    </div>
  )
}

export { LabeledProgress }
export type { LabeledProgressProps }
