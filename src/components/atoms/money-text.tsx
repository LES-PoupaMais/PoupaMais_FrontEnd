import { cva } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/cn'
import { formatarSaldo, formatarValorComSinal, type ValorMonetario } from '@/lib/format'

// Valor em reais (DS: MoneyText). Sempre com centavos e algarismos tabulares; nunca só cor:
// receita = "+ R$" + seta para cima + verde; despesa = "− R$" + seta para baixo + coral; neutro = totais e saldo.
const moneyTextVariants = cva('inline-flex items-center gap-1 whitespace-nowrap tabular-nums', {
  variants: {
    tipo: {
      RECEITA: 'text-receita',
      DESPESA: 'text-despesa',
      neutro: 'text-foreground',
    },
    tamanho: {
      destaque: 'text-valor-destaque',
      tile: 'text-valor-tile',
      linha: 'text-valor-linha',
    },
    suave: { true: 'text-muted-foreground' },
  },
  defaultVariants: { tipo: 'neutro', tamanho: 'linha' },
})

// Tamanho máximo de cada estilo, usado quando `ajustar` encolhe a fonte para caber (nunca corta os centavos)
const AJUSTE: Record<NonNullable<MoneyTextProps['tamanho']>, string> = {
  destaque: 'text-[clamp(12px,6.8cqi,34px)]',
  tile: 'text-[clamp(12px,6.8cqi,22px)]',
  linha: 'text-[clamp(12px,6.8cqi,16px)]',
}

const ROTULO_TIPO = { RECEITA: 'Receita', DESPESA: 'Despesa' } as const

type MoneyTextProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  /** Número (ou string decimal vinda da API) */
  valor: ValorMonetario
  /** O sinal vem do tipo, nunca do número digitado */
  tipo?: 'RECEITA' | 'DESPESA' | 'neutro'
  tamanho?: 'destaque' | 'tile' | 'linha'
  /** Fora do saldo ou na lixeira: cor suave, mantendo sinal e seta */
  suave?: boolean
  /** Encolhe a fonte quando o valor não cabe na largura do pai */
  ajustar?: boolean
  /** Lê "Receita, " ou "Despesa, " antes do valor (use quando a linha não tem selo de tipo) */
  anunciarTipo?: boolean
}

function MoneyText({
  valor,
  tipo = 'neutro',
  tamanho = 'linha',
  suave = false,
  ajustar = false,
  anunciarTipo = false,
  className,
  ...props
}: MoneyTextProps) {
  const texto = tipo === 'neutro' ? formatarSaldo(valor) : formatarValorComSinal(valor, tipo)
  const Seta = tipo === 'RECEITA' ? ArrowUpRight : tipo === 'DESPESA' ? ArrowDownRight : null

  const conteudo = (
    <span
      data-slot="money-text"
      data-valor=""
      data-tipo={tipo}
      className={cn(moneyTextVariants({ tipo, tamanho, suave }), ajustar && AJUSTE[tamanho], className)}
      {...props}
    >
      {Seta && <Seta className="size-[1em] shrink-0" aria-hidden="true" />}
      {anunciarTipo && tipo !== 'neutro' && <span className="sr-only">{ROTULO_TIPO[tipo]}, </span>}
      {texto}
    </span>
  )

  // container query: a fonte acompanha a largura do pai (cqi) até o tamanho do estilo
  return ajustar ? <span className="@container block w-full min-w-0">{conteudo}</span> : conteudo
}

export { MoneyText, moneyTextVariants }
export type { MoneyTextProps }
