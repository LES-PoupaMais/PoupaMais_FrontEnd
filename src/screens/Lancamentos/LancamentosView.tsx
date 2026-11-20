'use client'

import { Calendar, ChevronDown, Plus, SearchX } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { ExportDialog } from '@/components/organisms/export-dialog'
import { FilterBar, temFiltro } from '@/components/organisms/filter-bar'
import {
  TransactionDetail,
  TransactionDetailPanel,
  TransactionDetailSkeleton,
} from '@/components/organisms/transaction-detail'
import { TransactionRow, TransactionRowList } from '@/components/organisms/transaction-row'
import { TransactionTable } from '@/components/organisms/transaction-table'
import { ROTAS } from '@/constants/rotas'
import { formatarMesAno, nomeDoMes } from '@/lib/format'
import { useLancamentosContext } from './LancamentosContext'
import { LancamentosListaSkeleton } from './LancamentosSkeleton'
import { descreverFiltros, filtrosParaExportar, origemParaExportar } from './filtrosDaUrl'

const ID_MOTIVO_OFFLINE = 'lancamentos-offline-motivo'

export function LancamentosView() {
  const ctx = useLancamentosContext()
  const { periodo, filtros, categorias, lancamentos, total, online } = ctx
  const mesAno = formatarMesAno(periodo.mes, periodo.ano)
  const mesExtenso = `${nomeDoMes(periodo.mes).toLowerCase()} de ${periodo.ano}`
  const motivo = online ? undefined : ID_MOTIVO_OFFLINE
  const comFiltro = temFiltro(filtros)

  return (
    <div className="flex flex-col gap-3 md:gap-5">
      <header className="hidden flex-col gap-0.5 md:flex">
        <h1 className="text-titulo-1">Lançamentos</h1>
        <p className="text-corpo text-muted-foreground">Receitas e despesas de {mesExtenso}</p>
      </header>

      <FilterBar
        filtros={filtros}
        busca={ctx.busca}
        onBuscaChange={ctx.setBusca}
        categorias={categorias}
        periodo={periodo}
        onMudarMes={ctx.irParaMes}
        onChange={ctx.mudarFiltros}
        onLimpar={ctx.limparFiltros}
        onIrParaLixeira={ctx.irParaLixeira}
        total={total}
        onExportar={() => ctx.setExportarAberto(true)}
        hrefImportar={ROTAS.importar}
        onBaixarModelo={ctx.baixarModelo}
        // celular: os filtros encostam no topo como na prancheta lancamentos-celular (o main tem 24px)
        className="-mt-6 md:mt-0"
      />

      {!online && <OfflineMotivo id={ID_MOTIVO_OFFLINE} />}

      {conteudo()}

      <TransactionDetailPanel aberto={ctx.detalheAberto} onFechar={ctx.fecharDetalhe}>
        {ctx.detalhe ? (
          <TransactionDetail
            lancamento={ctx.detalhe}
            hrefEditar={ROTAS.editarLancamento(ctx.detalhe.id)}
            onAlternarSaldo={(conta) => ctx.detalhe && ctx.alternarSaldo(ctx.detalhe, conta)}
            alterandoSaldo={ctx.ocupados.has(ctx.detalhe.id)}
            onMoverParaLixeira={() => ctx.detalhe && ctx.moverParaLixeira(ctx.detalhe)}
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
        filtrosAtivos={filtrosParaExportar(filtros, categorias, periodo)}
        total={total}
        origem={origemParaExportar(filtros, periodo)}
        onBaixar={ctx.baixar}
        baixando={ctx.baixando}
        onMudarFiltros={() => ctx.setExportarAberto(false)}
        motivoDesabilitado={online ? undefined : 'exportar-offline-motivo'}
      />
    </div>
  )

  function conteudo() {
    if (ctx.carregando) return <LancamentosListaSkeleton />
    if (ctx.erro) return <ErrorState onTentarDeNovo={ctx.tentarDeNovo} tentando={ctx.tentando} />
    if (lancamentos.length === 0) {
      return comFiltro ? (
        <EmptyState
          icone={SearchX}
          titulo={filtros.q.trim() ? `Nada encontrado para “${filtros.q.trim()}”` : 'Nada encontrado com esses filtros'}
          texto="Mude ou limpe os filtros para ver mais lançamentos."
          acoes={
            <Button variant="contornado" onClick={ctx.limparFiltros}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <EmptyState
          icone={Calendar}
          titulo={`Não há lançamentos em ${mesAno}`}
          texto="Troque o mês no topo ou crie um lançamento com uma data deste mês."
          acoes={
            <Button asChild variant="contornado">
              <Link href={ROTAS.novoLancamento}>
                <Plus aria-hidden="true" />
                Novo lançamento
              </Link>
            </Button>
          }
        />
      )
    }

    const contador = `Mostrando ${lancamentos.length} de ${total ?? lancamentos.length}`
    const descricao = comFiltro
      ? `Lançamentos de ${mesExtenso} com os filtros ${descreverFiltros(filtros, categorias)}`
      : `Lançamentos de ${mesExtenso}`

    return (
      <>
        {/* celular e tablet: cards */}
        <section aria-label={descricao} className="flex flex-col gap-2 lg:hidden">
          <h2 className="sr-only">{`${descricao}, do mais recente para o mais antigo`}</h2>
          <TransactionRowList>
            {lancamentos.map((lancamento) => (
              <li key={lancamento.id}>
                <TransactionRow lancamento={lancamento} href={ctx.hrefDe(lancamento)} onAbrir={ctx.abrir} />
              </li>
            ))}
          </TransactionRowList>
          <div className="flex flex-col items-center gap-2 pt-3">
            {ctx.temMais && (
              <Button variant="contornado" loading={ctx.carregandoMais} onClick={ctx.mostrarMais}>
                {!ctx.carregandoMais && <ChevronDown aria-hidden="true" />}
                Mostrar mais
              </Button>
            )}
            <span className="text-legenda text-muted-foreground tabular-nums">{contador}</span>
          </div>
        </section>

        {/* computador: tabela */}
        <div className="hidden lg:block">
          <TransactionTable
            lancamentos={lancamentos}
            titulo={mesAno}
            legenda={
              comFiltro
                ? descreverFiltros(filtros, categorias)
                : 'Todos os status · da data mais recente para a mais antiga'
            }
            descricaoTabela={descricao}
            hrefDe={ctx.hrefDe}
            onAbrir={ctx.abrir}
            hrefEditar={(l) => ROTAS.editarLancamento(l.id)}
            onAlternarSaldo={ctx.alternarSaldo}
            onMoverParaLixeira={ctx.moverParaLixeira}
            ocupados={ctx.ocupados}
            motivoDesabilitado={motivo}
            rodape={
              <>
                <span className="text-legenda text-muted-foreground tabular-nums">{`${contador} lançamentos`}</span>
                {ctx.temMais && (
                  <Button variant="contornado" size="pequeno" loading={ctx.carregandoMais} onClick={ctx.mostrarMais}>
                    {!ctx.carregandoMais && <ChevronDown aria-hidden="true" />}
                    Mostrar mais
                  </Button>
                )}
              </>
            }
            dica={
              <>
                <strong>Conta no saldo</strong> desligado: o lançamento continua na lista, esmaecido, mas não entra no
                saldo nem no dashboard. Clique numa linha para ver o lançamento.
              </>
            }
          />
        </div>
      </>
    )
  }
}
