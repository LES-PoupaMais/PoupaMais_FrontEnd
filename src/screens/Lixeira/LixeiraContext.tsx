'use client'

import { RotateCcw } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, useState, type MouseEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ROTAS } from '@/constants/rotas'
import { useConexao } from '@/hooks/use-conexao'
import { useExportarLancamentos } from '@/hooks/use-exportacao'
import { useLancamento, useLancamentos } from '@/hooks/use-lancamentos'
import { MIDIA, useMediaQuery } from '@/hooks/use-media-query'
import { useRestaurarLancamento } from '@/hooks/use-mutacoes-lancamento'
import { partesDaData } from '@/lib/data'
import type { FormatoExportacao, Lancamento } from '@/types/api'

// Lixeira (`/lancamentos/lixeira`, status=DELETADO, todos os meses): sem switch e sem Editar; Restaurar volta como inativo
// com o toast "Restaurado como inativo. Ative para voltar ao dashboard.". Visualização no painel `?ver=<id>` a partir de 768px.

export const TOAST_RESTAURADO = 'Restaurado como inativo. Ative para voltar ao dashboard.'
export const TOAST_RESTAURAR_ERRO = 'Não foi possível restaurar.'
const FILTRO_LIXEIRA = { status: 'DELETADO' } as const

type LixeiraContextValue = {
  lancamentos: Lancamento[]
  total: number | null
  carregando: boolean
  erro: boolean
  tentarDeNovo: () => void
  tentando: boolean
  temMais: boolean
  mostrarMais: () => void
  carregandoMais: boolean
  online: boolean
  ocupados: ReadonlySet<number>
  restaurar: (lancamento: Lancamento) => void
  hrefDe: (lancamento: Lancamento) => string
  abrir: (lancamento: Lancamento, evento: MouseEvent<HTMLAnchorElement>) => void
  detalheAberto: boolean
  detalhe: Lancamento | undefined
  detalheErro: boolean
  tentarDetalheDeNovo: () => void
  fecharDetalhe: () => void
  exportarAberto: boolean
  setExportarAberto: (aberto: boolean) => void
  formato: FormatoExportacao
  setFormato: (formato: FormatoExportacao) => void
  baixar: () => void
  baixando: boolean
}

const LixeiraContext = createContext<LixeiraContextValue | null>(null)

/** Link "Ver" do toast: a lista do mês do lançamento restaurado */
function listaDoMes({ data }: Lancamento) {
  const { mes, ano } = partesDaData(data)
  return `${ROTAS.lancamentos}?mes=${mes}&ano=${ano}`
}

export function LixeiraProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const verId = Number(parametros.get('ver')) || undefined
  const tabletOuMaior = useMediaQuery(MIDIA.tablet)
  const online = useConexao()

  const consulta = useLancamentos(FILTRO_LIXEIRA)
  const itens = consulta.data?.itens ?? []
  const [ocupados, setOcupados] = useState<ReadonlySet<number>>(new Set())

  const comVer = (id: number | undefined) => {
    const novos = new URLSearchParams(parametros.toString())
    if (id === undefined) novos.delete('ver')
    else novos.set('ver', String(id))
    const query = novos.toString()
    router.replace(query ? `${caminho}?${query}` : caminho, { scroll: false })
  }
  const fecharDetalhe = () => comVer(undefined)

  const restaurarMutation = useRestaurarLancamento()
  const restaurar = (lancamento: Lancamento) => {
    setOcupados((atual) => new Set(atual).add(lancamento.id))
    restaurarMutation.mutate(lancamento.id, {
      onSuccess: () => {
        if (verId === lancamento.id) fecharDetalhe()
        toast(TOAST_RESTAURADO, {
          icon: <RotateCcw className="size-5" aria-hidden="true" />,
          action: { label: 'Ver', onClick: () => router.push(listaDoMes(lancamento)) },
        })
      },
      onError: () => toast.error(TOAST_RESTAURAR_ERRO),
      onSettled: () =>
        setOcupados((atual) => {
          const novo = new Set(atual)
          novo.delete(lancamento.id)
          return novo
        }),
    })
  }

  const abrir = (lancamento: Lancamento, evento: MouseEvent<HTMLAnchorElement>) => {
    if (!tabletOuMaior) return
    evento.preventDefault()
    comVer(lancamento.id)
  }
  const consultaDetalhe = useLancamento(verId)
  const detalhe = consultaDetalhe.data ?? itens.find((l) => l.id === verId)

  const [exportarAberto, setExportarAberto] = useState(false)
  const [formato, setFormato] = useState<FormatoExportacao>('csv')
  const exportar = useExportarLancamentos()
  const baixar = () =>
    exportar.mutate(
      { formato, filtros: FILTRO_LIXEIRA },
      {
        onSuccess: () => {
          setExportarAberto(false)
          toast.success('Arquivo exportado')
        },
        onError: () => toast.error('Não foi possível exportar.'),
      },
    )

  const valor: LixeiraContextValue = {
    lancamentos: itens,
    total: consulta.data ? consulta.data.total : null,
    carregando: consulta.isPending,
    erro: consulta.isError && !consulta.data,
    tentarDeNovo: () => void consulta.refetch(),
    tentando: consulta.isRefetching,
    temMais: consulta.hasNextPage,
    mostrarMais: () => void consulta.fetchNextPage(),
    carregandoMais: consulta.isFetchingNextPage,
    online,
    ocupados,
    restaurar,
    hrefDe: (lancamento) => ROTAS.lancamento(lancamento.id),
    abrir,
    detalheAberto: verId !== undefined,
    detalhe,
    detalheErro: !detalhe && consultaDetalhe.isError,
    tentarDetalheDeNovo: () => void consultaDetalhe.refetch(),
    fecharDetalhe,
    exportarAberto,
    setExportarAberto,
    formato,
    setFormato,
    baixar,
    baixando: exportar.isPending,
  }
  return <LixeiraContext.Provider value={valor}>{children}</LixeiraContext.Provider>
}

export function useLixeiraContext() {
  const contexto = useContext(LixeiraContext)
  if (!contexto) throw new Error('useLixeiraContext precisa estar dentro de <LixeiraProvider>')
  return contexto
}
