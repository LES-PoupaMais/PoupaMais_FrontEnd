'use client'

import { Download, Plus, Upload, Wallet } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { EmptyState } from '@/components/molecules/empty-state'
import { ErrorState } from '@/components/molecules/error-state'
import { MonthNavigator } from '@/components/molecules/month-navigator'
import { SpendRate } from '@/components/molecules/spend-rate'
import { StatCard, StatCardGrade } from '@/components/molecules/stat-card'
import { BalanceChart } from '@/components/organisms/balance-chart'
import { CategoryBarChart } from '@/components/organisms/category-bar-chart'
import { HighlightCard } from '@/components/organisms/highlight-card'
import { IncomeExpenseChart } from '@/components/organisms/income-expense-chart'
import { MaioresDespesas } from '@/components/organisms/maiores-despesas'
import { DashboardTemplate } from '@/components/templates/dashboard-template'
import { ROTAS } from '@/constants/rotas'
import { formatarMesAno, formatarMoeda, nomeDoMes } from '@/lib/format'
import type { Dashboard } from '@/types/api'
import { useDashboardContext } from './DashboardContext'
import { esqueletosDoDashboard } from './DashboardSkeleton'

// Dashboard (pranchetas dashboard-*): grade de 12 colunas do DashboardTemplate. Estados: carregando (esqueletos com as
// medidas reais), vazio (mês sem lançamentos: saldo e tiles zerados no tablet/computador + EmptyState com a próxima ação),
// erro (ErrorState com "Tentar de novo"), sem conexão (OfflineBanner; os dados já carregados continuam na tela).
export function DashboardView() {
  const { periodo, irParaMes, dashboard, carregando, erro, tentarDeNovo, tentando, vazio, primeiroNome, baixarModelo } =
    useDashboardContext()
  const ola = primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'
  // A frase do mês vazio usa o mês do próprio dado (nunca o da URL, que pode estar à frente durante a troca)
  const subtitulo =
    vazio && dashboard
      ? `${formatarMesAno(dashboard.mes, dashboard.ano)} ainda não tem lançamentos.`
      : 'Este é o resumo do mês.'

  const cabecalho = (
    <>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-titulo-1">Dashboard</h1>
        <p className="text-corpo text-muted-foreground">
          {ola}. {subtitulo}
        </p>
      </div>
      <MonthNavigator seletor="popover" mes={periodo.mes} ano={periodo.ano} onChange={irParaMes} />
    </>
  )

  const conteudo = () => {
    if (erro) {
      return (
        <DashboardTemplate
          cabecalho={cabecalho}

          estado={
            <ErrorState
              titulo="Não foi possível carregar o dashboard"
              onTentarDeNovo={tentarDeNovo}
              tentando={tentando}
            />
          }
        />
      )
    }
    if (carregando || !dashboard)
      return (
        <DashboardTemplate
          cabecalho={cabecalho}

          {...esqueletosDoDashboard}
        />
      )
    if (vazio) {
      return (
        <DashboardTemplate
          cabecalho={cabecalho}

          estado={<MesVazio dashboard={dashboard} onBaixarModelo={baixarModelo} />}
        />
      )
    }
    return (
      <DashboardTemplate
        cabecalho={cabecalho}

        saldo={
          <HighlightCard
            saldo={dashboard.saldo}
            mes={dashboard.mes}
            ano={dashboard.ano}
            mensagem={dashboard.mensagem}
            className="h-full"
          />
        }
        indicadores={<Indicadores dashboard={dashboard} />}
        receitasDespesas={<IncomeExpenseChart dados={dashboard.ultimosMeses} />}
        saldoMensal={<BalanceChart dados={dashboard.ultimosMeses} />}
        categorias={
          <CategoryBarChart
            dados={dashboard.despesasPorCategoria}
            total={dashboard.despesas}
            mes={dashboard.mes}
            ano={dashboard.ano}
          />
        }
        maioresDespesas={
          <MaioresDespesas
            itens={dashboard.maioresDespesas}
            peso={dashboard.pesoMaioresDespesas}
            totalDespesas={dashboard.despesas}
            mes={dashboard.mes}
            ano={dashboard.ano}
          />
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-0" aria-busy={carregando || undefined}>
      {/* celular: título e mês ficam na TopBar; aqui só a saudação */}
      <div className="-mt-2 flex flex-col gap-0.5 md:hidden">
        <p className="text-titulo-2">{ola}</p>
        {vazio && <p className="text-legenda text-muted-foreground">{subtitulo}</p>}
      </div>
      {conteudo()}
    </div>
  )
}

/** Receitas e Despesas (StatCard) + Taxa de gasto (SpendRate na largura toda), como nas pranchetas */
function Indicadores({ dashboard }: { dashboard: Dashboard }) {
  return (
    <StatCardGrade
      aria-label={`Resumo de ${nomeDoMes(dashboard.mes).toLowerCase()} de ${dashboard.ano}`}
      className="col-span-full h-full gap-4 lg:gap-5"
    >
      <StatCard
        funcao="receita"
        rotulo="Receitas"
        valor={formatarMoeda(dashboard.receitas)}
        className="justify-between"
      />
      <StatCard
        funcao="despesa"
        rotulo="Despesas"
        valor={formatarMoeda(dashboard.despesas)}
        className="justify-between"
      />
      <SpendRate
        role="listitem"
        taxa={dashboard.taxaGasto}
        classificacao={dashboard.classificacaoTaxa}
        className="col-span-full"
      />
    </StatCardGrade>
  )
}

/** Mês sem lançamentos: no tablet/computador, saldo e tiles zerados acima; em todas as larguras, o primeiro passo */
function MesVazio({ dashboard, onBaixarModelo }: { dashboard: Dashboard; onBaixarModelo: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-12">
      <div className="hidden min-w-0 md:block lg:col-span-4">
        <HighlightCard
          saldo={dashboard.saldo}
          mes={dashboard.mes}
          ano={dashboard.ano}
          mensagem={dashboard.mensagem}
          className="h-full"
        />
      </div>
      <div className="hidden min-w-0 md:grid lg:col-span-8">
        <Indicadores dashboard={dashboard} />
      </div>
      <EmptyState
        icone={Wallet}
        funcao="primaria"
        superficie="grande"
        titulo="Comece pelo seu primeiro lançamento"
        texto="Registre uma receita ou despesa, ou traga várias de uma vez com uma planilha CSV. O resumo do mês, os gráficos e as maiores despesas aparecem aqui."
        className="md:col-span-2 md:px-8 md:py-12 lg:col-span-12 max-md:[&_[data-slot=empty-state-acoes]]:w-full max-md:[&_[data-slot=empty-state-acoes]]:max-w-80 max-md:[&_[data-slot=empty-state-acoes]]:flex-col max-md:[&_[data-slot=empty-state-acoes]]:items-stretch"
        acoes={
          <>
            <Button asChild>
              <Link href={ROTAS.novoLancamento}>
                <Plus aria-hidden="true" />
                Criar primeiro lançamento
              </Link>
            </Button>
            <Button asChild variant="contornado">
              <Link href={ROTAS.importar}>
                <Upload aria-hidden="true" />
                Importar CSV
              </Link>
            </Button>
            <Button variant="texto" onClick={onBaixarModelo}>
              <Download aria-hidden="true" />
              Baixar modelo CSV
            </Button>
          </>
        }
      />
    </div>
  )
}
