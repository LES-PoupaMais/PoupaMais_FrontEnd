'use client'

import { ChevronDown, Download, List, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { ActionBanner } from '@/components/molecules/action-banner'
import { EmptyState } from '@/components/molecules/empty-state'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineBanner, OfflineMotivo } from '@/components/molecules/offline-banner'
import { ExportDialog } from '@/components/organisms/export-dialog'
import {
  TransactionDetail,
  TransactionDetailPanel,
  TransactionDetailSkeleton,
} from '@/components/organisms/transaction-detail'
import { TransactionRow, TransactionRowList } from '@/components/organisms/transaction-row'
import { TransactionTable } from '@/components/organisms/transaction-table'
import { ROTAS } from '@/constants/rotas'
import { useLixeiraContext } from './LixeiraContext'
import { LixeiraListaSkeleton } from './LixeiraSkeleton'

const ID_MOTIVO_OFFLINE = 'lixeira-offline-motivo'
const plural = (n: number) => `${n} ${n === 1 ? 'lançamento' : 'lançamentos'} na lixeira`

export function LixeiraView() {
  const ctx = useLixeiraContext()
  const { lancamentos, total, online } = ctx
  const motivo = online ? undefined : ID_MOTIVO_OFFLINE
  const vazia = !ctx.carregando && !ctx.erro && lancamentos.length === 0

  const botaoExportar = (
    <Button
      variant="contornado"
      size="pequeno"
      aria-haspopup="dialog"
      disabled={vazia || ctx.carregando}
      onClick={() => ctx.setExportarAberto(true)}
    >
      <Download aria-hidden="true" />
      Exportar
    </Button>
  )

  return (
    <div className="flex flex-col gap-5">
      {!online && <OfflineBanner variante="canto" />}
      <header className="hidden flex-wrap items-end justify-between gap-4 md:flex">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-titulo-1">Lixeira</h1>
          <p className="text-corpo text-muted-foreground">
            Lançamentos excluídos de todos os meses. Eles não entram no saldo.
          </p>
        </div>
        {botaoExportar}
      </header>

      {conteudo()}

      <TransactionDetailPanel aberto={ctx.detalheAberto} onFechar={ctx.fecharDetalhe}>
        {ctx.detalhe ? (
          <TransactionDetail
            lancamento={ctx.detalhe}
            onRestaurar={() => ctx.detalhe && ctx.restaurar(ctx.detalhe)}
            restaurando={ctx.ocupados.has(ctx.detalhe.id)}
            motivoDesabilitado={motivo}
          />
        ) : ctx.detalheErro ? (
          <ErrorState semCartao onTentarDeNovo={ctx.tentarDetalheDeNovo} />
        ) : (
          <TransactionDetailSkeleton />
        )}
      </TransactionDetailPanel>

      <ExportDialog
        aberto={ctx.exportarAberto}
        onAbertoChange={ctx.setExportarAberto}
        formato={ctx.formato}
        onFormatoChange={ctx.setFormato}
        filtrosAtivos="Lixeira · todos os meses"
        total={total}
        origem="Lixeira · todos os meses"
        lixeira
        onBaixar={ctx.baixar}
        baixando={ctx.baixando}
        motivoDesabilitado={online ? undefined : 'exportar-offline-motivo'}
      />
    </div>
  )

  function conteudo() {
    if (ctx.carregando) return <LixeiraListaSkeleton />
    if (ctx.erro) return <ErrorState onTentarDeNovo={ctx.tentarDeNovo} tentando={ctx.tentando} />
    if (vazia)
      return (
        <EmptyState
          icone={Trash2}
          titulo="A lixeira está vazia"
          texto="Quando você excluir um lançamento, ele fica aqui e pode ser restaurado."
          acoes={
            <Button asChild variant="texto">
              <Link href={ROTAS.lancamentos}>
                <List aria-hidden="true" />
                Ver lançamentos
              </Link>
            </Button>
          }
        />
      )

    const titulo = plural(total ?? lancamentos.length)
    const contador = `Mostrando ${lancamentos.length} de ${total ?? lancamentos.length}`
    const mostrarMais = (tamanho: 'padrao' | 'pequeno') =>
      ctx.temMais && (
        <Button variant="contornado" size={tamanho} loading={ctx.carregandoMais} onClick={ctx.mostrarMais}>
          {!ctx.carregandoMais && <ChevronDown aria-hidden="true" />}
          Mostrar mais
        </Button>
      )

    return (
      <>
        <ActionBanner texto="Itens restaurados voltam fora do saldo." />
        {!online && <OfflineMotivo id={ID_MOTIVO_OFFLINE} />}

        <section aria-labelledby="lixeira-contador" className="flex flex-col gap-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 id="lixeira-contador" className="text-titulo-3 tabular-nums">
                {titulo}
              </h2>
              <span className="text-legenda text-muted-foreground">Todos os meses</span>
            </div>
            <span className="md:hidden">
              <Button
                variant="texto"
                size="icone"
                aria-label="Exportar a lixeira"
                aria-haspopup="dialog"
                onClick={() => ctx.setExportarAberto(true)}
              >
                <Download aria-hidden="true" />
              </Button>
            </span>
          </div>
          <TransactionRowList>
            {lancamentos.map((lancamento) => (
              <li key={lancamento.id}>
                <TransactionRow
                  lancamento={lancamento}
                  href={ctx.hrefDe(lancamento)}
                  onAbrir={ctx.abrir}
                  comAno
                  onRestaurar={ctx.restaurar}
                  restaurando={ctx.ocupados.has(lancamento.id)}
                  motivoDesabilitado={motivo}
                />
              </li>
            ))}
          </TransactionRowList>
          <div className="flex flex-col items-center gap-2 pt-1">
            {mostrarMais('padrao')}
            {ctx.temMais && <span className="text-legenda text-muted-foreground tabular-nums">{contador}</span>}
          </div>
          <p className="text-legenda text-muted-foreground">Toque num lançamento para ver os detalhes.</p>
        </section>

        <div className="hidden lg:block">
          <TransactionTable
            modo="lixeira"
            lancamentos={lancamentos}
            titulo={titulo}
            legenda="Todos os meses"
            descricaoTabela="Lançamentos na lixeira"
            hrefDe={ctx.hrefDe}
            onAbrir={ctx.abrir}
            onRestaurar={ctx.restaurar}
            ocupados={ctx.ocupados}
            motivoDesabilitado={motivo}
            rodape={
              ctx.temMais ? (
                <>
                  <span className="text-legenda text-muted-foreground tabular-nums">{`${contador} lançamentos`}</span>
                  {mostrarMais('pequeno')}
                </>
              ) : undefined
            }
            dica="Clique numa linha para ver o lançamento. Restaurar devolve o lançamento para a lista, fora do saldo. Para ele voltar ao dashboard, ligue Conta no saldo."
          />
        </div>
      </>
    )
  }
}
