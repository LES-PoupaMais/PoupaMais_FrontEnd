'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { mostrarToastDesfazer } from '@/components/molecules/undo-toast'
import { FILTROS_VAZIOS, type FiltrosLista } from '@/components/organisms/filter-bar'
import { ROTAS } from '@/constants/rotas'
import { useCategorias } from '@/hooks/use-categorias'
import { useOnline } from '@/hooks/use-online'
import { TOAST_MODELO_CSV, useBaixarModeloCsv, useExportarLancamentos } from '@/hooks/use-exportacao'
import { useLancamento, useLancamentos } from '@/hooks/use-lancamentos'
import { useMoverParaLixeiraComDesfazer } from '@/hooks/use-lixeira'
import { MIDIA, useMediaQuery } from '@/hooks/use-media-query'
import { useAlterarStatusLancamento } from '@/hooks/use-mutacoes-lancamento'
import { useValorComEspera } from '@/hooks/use-valor-com-espera'
import { traduzirErro } from '@/lib/http'
import { comPeriodo, lerPeriodo } from '@/lib/periodo'
import type { CategoriaComContagem, FormatoExportacao, Lancamento, MesAno } from '@/types/api'
import { comFiltros, lerFiltros, lerVer, paraApi } from './filtrosDaUrl'

// Lançamentos: lista do mês com filtros na URL, "Conta no saldo", mover para a lixeira com Desfazer, visualização
// (painel `?ver=<id>` a partir de 768px; tela cheia `/lancamentos/[id]` no celular) e Exportar com os filtros ativos.

export const TOAST_SALDO = {
  ligado: 'Lançamento de volta ao saldo',
  desligado: 'Lançamento fora do saldo. Ele continua na lista.',
  erro: 'Não foi possível mudar Conta no saldo.',
}
export const TOAST_LIXEIRA = {
  mensagem: 'Movido para a lixeira',
  erro: 'Não foi possível mover para a lixeira.',
  erroDesfazer: 'Não foi possível restaurar.',
}
export const TOAST_EXPORTAR = { sucesso: 'Arquivo exportado', erro: 'Não foi possível exportar.' }
export const TOAST_MODELO = TOAST_MODELO_CSV

type LancamentosContextValue = {
  periodo: MesAno
  filtros: FiltrosLista
  /** Texto do campo de busca: a fonte da verdade enquanto a pessoa digita (vai para a URL 500 ms depois da última tecla) */
  busca: string
  setBusca: (texto: string) => void
  irParaMes: (periodo: MesAno) => void
  mudarFiltros: (mudanca: Partial<FiltrosLista>) => void
  limparFiltros: () => void
  irParaLixeira: () => void

  lancamentos: Lancamento[]
  /** `total` da API; `null` enquanto carrega */
  total: number | null
  carregando: boolean
  erro: boolean
  tentarDeNovo: () => void
  tentando: boolean
  temMais: boolean
  mostrarMais: () => void
  carregandoMais: boolean

  categorias: CategoriaComContagem[]
  online: boolean

  ocupados: ReadonlySet<number>
  alternarSaldo: (lancamento: Lancamento, contaNoSaldo: boolean) => void
  moverParaLixeira: (lancamento: Lancamento) => void

  hrefDe: (lancamento: Lancamento) => string
  abrir: (lancamento: Lancamento, evento: MouseEvent<HTMLAnchorElement>) => void
  detalheAberto: boolean
  detalhe: Lancamento | undefined
  detalheCarregando: boolean
  detalheErro: boolean
  tentarDetalheDeNovo: () => void
  fecharDetalhe: () => void

  exportarAberto: boolean
  setExportarAberto: (aberto: boolean) => void
  formato: FormatoExportacao
  setFormato: (formato: FormatoExportacao) => void
  baixar: () => void
  baixando: boolean
  baixarModelo: () => void
}

const LancamentosContext = createContext<LancamentosContextValue | null>(null)

export function LancamentosProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const busca = parametros.toString()
  const periodo = lerPeriodo(parametros)
  const filtros = useMemo(() => lerFiltros(new URLSearchParams(busca)), [busca])
  const verId = lerVer(parametros)
  const tabletOuMaior = useMediaQuery(MIDIA.tablet)
  const online = useOnline()

  const irPara = useCallback(
    (query: string) => router.replace(query ? `${caminho}?${query}` : caminho, { scroll: false }),
    [router, caminho],
  )
  const irParaMes = (novo: MesAno) => irPara(comPeriodo(busca, novo))
  const aplicarFiltros = useCallback(
    (mudanca: Partial<FiltrosLista>) => irPara(comFiltros(busca, { ...filtros, ...mudanca })),
    [irPara, busca, filtros],
  )

  // ---------- busca (o campo não perde o que a pessoa digita) ----------
  // O texto do campo é a fonte da verdade. Ele vai para a URL 500 ms depois da última tecla (`replace`, sem encher o
  // histórico). A URL só reescreve o campo quando muda POR FORA (Limpar, chip removido, voltar no navegador); o eco da
  // própria busca (a URL chegando com um valor já enviado, talvez atrasado) é reconhecido em `enviadas` e ignorado.
  const [textoBusca, setTextoBusca] = useState(filtros.q)
  const [qAntes, setQAntes] = useState(filtros.q)
  const [enviadas, setEnviadas] = useState<readonly string[]>([])
  const buscaComEspera = useValorComEspera(textoBusca)
  const [esperaAntes, setEsperaAntes] = useState(buscaComEspera)
  const qComEspera = buscaComEspera.trim()

  if (filtros.q !== qAntes) {
    setQAntes(filtros.q)
    const posicao = enviadas.indexOf(filtros.q)
    if (posicao >= 0) {
      setEnviadas(enviadas.slice(posicao + 1)) // eco da própria busca: o campo fica como está
    } else {
      setEnviadas([]) // veio de fora: o campo acompanha a URL
      setTextoBusca(filtros.q)
    }
  } else if (buscaComEspera !== esperaAntes) {
    setEsperaAntes(buscaComEspera)
    // A pessoa parou de digitar num valor novo: ele será enviado (efeito abaixo) e o eco dele não mexe no campo
    if (qComEspera !== filtros.q && enviadas.at(-1) !== qComEspera) setEnviadas([...enviadas, qComEspera])
  }

  useEffect(() => {
    // Só envia quando o campo parou (o valor com espera alcançou o texto); depois de uma mudança de fora, o valor com
    // espera ainda é o antigo e não pode desfazer o que veio da URL
    if (buscaComEspera !== textoBusca || qComEspera === filtros.q) return
    aplicarFiltros({ q: qComEspera })
  }, [buscaComEspera, textoBusca, qComEspera, filtros.q, aplicarFiltros])

  const mudarFiltros = (mudanca: Partial<FiltrosLista>) => {
    if (mudanca.q !== undefined) setTextoBusca(mudanca.q) // chip "Remover busca"
    aplicarFiltros(mudanca)
  }
  const limparFiltros = () => {
    setTextoBusca('')
    irPara(comFiltros(busca, FILTROS_VAZIOS))
  }
  const irParaLixeira = () => router.push(ROTAS.lixeira)

  // ---------- dados ----------
  const consulta = useLancamentos(paraApi(filtros, periodo))
  const { data: categorias = [] } = useCategorias()
  const [statusOtimista, setStatusOtimista] = useState<ReadonlyMap<number, Lancamento['status']>>(new Map())

  const aplicarOtimista = useCallback(
    (lancamento: Lancamento): Lancamento => {
      const status = statusOtimista.get(lancamento.id)
      return status ? { ...lancamento, status } : lancamento
    },
    [statusOtimista],
  )
  const itens = consulta.data?.itens
  const lancamentos = useMemo(() => (itens ?? []).map(aplicarOtimista), [itens, aplicarOtimista])
  const total = consulta.data ? consulta.data.total : null

  // ---------- Conta no saldo ----------
  const alterarStatus = useAlterarStatusLancamento()
  const alternarSaldo = (lancamento: Lancamento, contaNoSaldo: boolean) => {
    const status = contaNoSaldo ? 'ATIVO' : 'INATIVO'
    setStatusOtimista((atual) => new Map(atual).set(lancamento.id, status))
    alterarStatus.mutate(
      { id: lancamento.id, status },
      {
        onSuccess: () => toast.success(contaNoSaldo ? TOAST_SALDO.ligado : TOAST_SALDO.desligado),
        onError: (erro) => toast.error(traduzirErro(erro, { padrao: TOAST_SALDO.erro }).mensagem),
        onSettled: () =>
          setStatusOtimista((atual) => {
            const novo = new Map(atual)
            novo.delete(lancamento.id)
            return novo
          }),
      },
    )
  }

  // ---------- lixeira com Desfazer ----------
  const moverComDesfazer = useMoverParaLixeiraComDesfazer()
  const fecharDetalhe = () => {
    const novos = new URLSearchParams(busca)
    novos.delete('ver')
    irPara(novos.toString())
  }
  const moverParaLixeira = (lancamento: Lancamento) => {
    if (verId === lancamento.id) fecharDetalhe()
    // O DELETE vai na hora (a linha some) e o Desfazer do toast restaura ao status de antes (hooks/use-lixeira)
    const movido = moverComDesfazer(lancamento.id, { onErroAoDesfazer: () => toast.error(TOAST_LIXEIRA.erroDesfazer) })
    const idToast = mostrarToastDesfazer({ mensagem: TOAST_LIXEIRA.mensagem, onDesfazer: () => void movido.desfazer() })
    movido.envio.catch((erro: unknown) => {
      toast.dismiss(idToast)
      toast.error(traduzirErro(erro, { padrao: TOAST_LIXEIRA.erro }).mensagem)
    })
  }

  // ---------- visualização ----------
  const hrefDe = (lancamento: Lancamento) => ROTAS.lancamento(lancamento.id)
  const abrir = (lancamento: Lancamento, evento: MouseEvent<HTMLAnchorElement>) => {
    if (!tabletOuMaior) return // celular: segue o link para a tela cheia
    evento.preventDefault()
    const novos = new URLSearchParams(busca)
    novos.set('ver', String(lancamento.id))
    irPara(novos.toString())
  }
  const consultaDetalhe = useLancamento(verId)
  const daLista = lancamentos.find((l) => l.id === verId)
  const detalheBruto = consultaDetalhe.data ?? daLista
  const detalhe = detalheBruto && aplicarOtimista(detalheBruto)

  // ---------- exportar ----------
  const [exportarAberto, setExportarAberto] = useState(false)
  const [formato, setFormato] = useState<FormatoExportacao>('csv')
  const exportar = useExportarLancamentos()
  const baixar = () =>
    exportar.mutate(
      { formato, filtros: paraApi(filtros, periodo) },
      {
        onSuccess: () => {
          setExportarAberto(false)
          toast.success(TOAST_EXPORTAR.sucesso)
        },
        onError: (erro) => toast.error(traduzirErro(erro, { padrao: TOAST_EXPORTAR.erro }).mensagem),
      },
    )
  const modelo = useBaixarModeloCsv()
  const baixarModelo = () =>
    modelo.mutate(undefined, {
      onSuccess: () => toast.success(TOAST_MODELO.sucesso),
      onError: (erro) => toast.error(traduzirErro(erro, { padrao: TOAST_MODELO.erro }).mensagem),
    })

  const valor: LancamentosContextValue = {
    periodo,
    filtros,
    busca: textoBusca,
    setBusca: setTextoBusca,
    irParaMes,
    mudarFiltros,
    limparFiltros,
    irParaLixeira,
    lancamentos,
    total,
    carregando: consulta.isPending,
    erro: consulta.isError && !consulta.data,
    tentarDeNovo: () => void consulta.refetch(),
    tentando: consulta.isRefetching,
    temMais: consulta.hasNextPage,
    mostrarMais: () => void consulta.fetchNextPage(),
    carregandoMais: consulta.isFetchingNextPage,
    categorias,
    online,
    ocupados: new Set(statusOtimista.keys()),
    alternarSaldo,
    moverParaLixeira,
    hrefDe,
    abrir,
    detalheAberto: verId !== undefined,
    detalhe,
    detalheCarregando: !detalhe && consultaDetalhe.isPending,
    detalheErro: !detalhe && consultaDetalhe.isError,
    tentarDetalheDeNovo: () => void consultaDetalhe.refetch(),
    fecharDetalhe,
    exportarAberto,
    setExportarAberto,
    formato,
    setFormato,
    baixar,
    baixando: exportar.isPending,
    baixarModelo,
  }
  return <LancamentosContext.Provider value={valor}>{children}</LancamentosContext.Provider>
}

export function useLancamentosContext() {
  const contexto = useContext(LancamentosContext)
  if (!contexto) throw new Error('useLancamentosContext precisa estar dentro de <LancamentosProvider>')
  return contexto
}
