import { Receipt } from 'lucide-react'
import Link from 'next/link'
import type * as React from 'react'
import { FunctionIcon } from '@/components/atoms/function-icon'
import { Skeleton } from '@/components/atoms/skeleton'
import { EmptyState } from '@/components/molecules/empty-state'
import { LabeledProgress } from '@/components/molecules/labeled-progress'
import { ROTAS } from '@/constants/rotas'
import { cn } from '@/lib/cn'
import { formatarPorcentagem, formatarValorComSinal } from '@/lib/format'
import type { Dashboard, MaiorDespesa } from '@/types/api'
import { DashboardSecao } from './dashboard-secao'

// "Maiores despesas" do Dashboard (pranchetas dashboard-*): as 5 maiores despesas do mês (RN008, prontas da API) e o
// "Peso das 5 maiores" (`pesoMaioresDespesas`: soma e % sobre as despesas do mês). Tocar numa linha abre o lançamento.
// Celular: cada linha é um card (como a lista de lançamentos). A partir do tablet: lista dentro do card grande, com divisórias.
// A cor nunca é a única pista: sinal "−", seta e o texto "Despesa," para o leitor de tela (MoneyText).

type MaioresDespesasProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  itens: MaiorDespesa[]
  peso: Dashboard['pesoMaioresDespesas']
  /** Despesas do mês (o "de R$ 7.560,50" do peso) */
  totalDespesas: number
  mes: number
  ano: number
  carregando?: boolean
}

/** Lançamentos de despesa do mês ("Ver todos") */
function hrefDespesasDoMes(mes: number, ano: number): string {
  return `${ROTAS.lancamentos}?${new URLSearchParams({ mes: String(mes), ano: String(ano), tipo: 'DESPESA' })}`
}

const LINHA =
  'relative flex items-center gap-3 rounded-card border border-border bg-card p-4 shadow-card transition-colors hover:bg-secondary ' +
  'md:min-h-14 md:flex-1 md:rounded-none md:border-0 md:border-t md:bg-transparent md:px-0 md:py-2 md:shadow-none md:first:border-t-0 md:hover:bg-transparent'

function MaioresDespesas({
  itens,
  peso,
  totalDespesas,
  mes,
  ano,
  carregando = false,
  className,
  ...props
}: MaioresDespesasProps) {
  const verTodos = (
    <Link
      href={hrefDespesasDoMes(mes, ano)}
      aria-label="Ver todas as maiores despesas"
      className="text-legenda text-primary -my-3 inline-flex min-h-11 items-center font-bold hover:underline"
    >
      Ver todos
    </Link>
  )

  return (
    <DashboardSecao
      data-slot="maiores-despesas"
      idTitulo="maiores-despesas"
      titulo="Maiores despesas"
      lado={carregando || itens.length === 0 ? undefined : verTodos}
      cartao="a-partir-do-tablet"
      className={className}
      {...props}
    >
      {carregando ? (
        <div aria-hidden="true" className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={LINHA}>
              <Skeleton forma="icone" />
              <span className="flex flex-1 flex-col gap-2">
                <Skeleton forma="texto" className="w-4/5" />
                <Skeleton forma="texto" className="w-2/5" />
              </span>
              <Skeleton forma="texto" className="w-20" />
            </div>
          ))}
        </div>
      ) : itens.length === 0 ? (
        <EmptyState
          icone={Receipt}
          titulo="Não há informações disponíveis para o período"
          texto="As maiores despesas do mês aparecem aqui."
          nivel="h3"
          className="md:border-0 md:shadow-none"
        />
      ) : (
        <>
          <ul aria-labelledby="maiores-despesas" className="flex flex-1 flex-col gap-2 md:gap-0">
            {itens.map((item) => (
              <li key={item.id} className={LINHA}>
                <FunctionIcon funcao="despesa" className="self-start md:self-center" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={ROTAS.lancamento(item.id)}
                    aria-label={`Ver ${item.descricao}`}
                    className="text-corpo-forte text-foreground rounded-card focus-visible:after:outline-ring after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 md:truncate"
                  >
                    {item.descricao}
                  </Link>
                  {item.categorias.length > 0 && (
                    <span className="text-legenda text-muted-foreground flex flex-wrap gap-1">
                      {item.categorias.map((categoria, indice) => (
                        <span
                          key={categoria}
                          className={cn(
                            'rounded-pilula bg-secondary px-2 text-[12px] leading-5 font-semibold',
                            'md:bg-transparent md:p-0 md:text-[13px] md:leading-[18px] md:font-medium',
                          )}
                        >
                          {indice > 0 && <span className="hidden md:inline">· </span>}
                          {categoria}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="text-valor-linha text-despesa self-start whitespace-nowrap tabular-nums md:self-center">
                  <span className="sr-only">Despesa, </span>
                  {formatarValorComSinal(item.valor, 'DESPESA')}
                </span>
              </li>
            ))}
          </ul>
          {peso.percentual !== null && (
            <LabeledProgress
              titulo="Peso das 5 maiores"
              atual={peso.valor}
              total={totalDespesas}
              cor="despesa"
              status={`${formatarPorcentagem(peso.percentual)} das despesas do mês`}
              className="rounded-card border-border bg-card shadow-card mt-4 border p-4 md:rounded-none md:border-x-0 md:border-b-0 md:bg-transparent md:px-0 md:pt-4 md:pb-0 md:shadow-none"
            />
          )}
        </>
      )}
    </DashboardSecao>
  )
}

export { MaioresDespesas, hrefDespesasDoMes }
export type { MaioresDespesasProps }
