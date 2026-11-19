'use client'

import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { toast } from 'sonner'
import { mostrarToastDesfazer } from '@/components/molecules/undo-toast'
import type { ErroDeCampo, LancamentoFormDados, LancamentoFormValores } from '@/components/organisms/lancamento-form'
import { ROTAS } from '@/constants/rotas'
import { useCategorias, useSalvarCategoria } from '@/hooks/use-categorias'
import { useMoverParaLixeiraAdiado } from '@/hooks/use-lixeira-adiada'
import { useLancamento } from '@/hooks/use-lancamentos'
import { MIDIA, useMediaQuery } from '@/hooks/use-media-query'
import { useOnline } from '@/hooks/use-online'
import {
  useAlterarStatusLancamento,
  useRestaurarLancamento,
  useSalvarLancamento,
} from '@/hooks/use-mutacoes-lancamento'
import { hojeIso, partesDaData } from '@/lib/data'
import { erroDoNomeDaCategoria } from '@/lib/erro-categoria'
import { ErroApi } from '@/lib/http'
import { comPeriodo } from '@/lib/periodo'
import type { Categoria, Lancamento, StatusLancamento } from '@/types/api'
import { useAvisoAoSair, type PedidoDeSaida } from './useAvisoAoSair'

// Novo e Editar lançamento (pranchetas novo-*, editar-*, nova-categoria-inline-celular, novo-categorias-celular).
// Dados (lançamento e categorias), envio (POST/PUT + "Conta no saldo" pelo PATCH de status), criar categoria pelo campo,
// "Descartar alterações?", Mover para a lixeira (Desfazer) e Restaurar (lançamento na lixeira), com os toasts.

export const MENSAGENS_FORMULARIO = {
  salvo: 'Lançamento salvo',
  erroSalvar: 'Não foi possível salvar. O que você preencheu continua aqui.',
  confiraCampos: 'Confira os campos marcados.',
  categoriaInativa: 'Uma das categorias escolhidas está inativa. Escolha outra.',
  categoriaInexistente: 'Uma das categorias escolhidas não existe mais. Escolha outra.',
  categoriaCriada: (nome: string) => `Categoria "${nome}" criada`,
  erroCategoria: 'Não foi possível criar a categoria. Tente de novo.',
  movido: 'Movido para a lixeira',
  erroMover: 'Não foi possível mover para a lixeira. Tente de novo.',
  restaurado: 'Restaurado como inativo. Ative para voltar ao dashboard.',
  erroRestaurar: 'Não foi possível restaurar. Tente de novo.',
} as const

export type EstadoDaTela = 'carregando' | 'erro' | 'nao-encontrado' | 'lixeira' | 'pronto'

type NovaCategoria = { aberto: boolean; nome: string; erro: string | null }

type LancamentoFormContextValue = {
  modo: 'novo' | 'editar'
  estado: EstadoDaTela
  /** Editar: o lançamento carregado */
  lancamento: Lancamento | undefined
  valoresIniciais: LancamentoFormValores | null
  /** Muda para recomeçar o formulário (Limpar) */
  versaoDoFormulario: number
  hoje: string | null
  apresentacaoData: 'popover' | 'folha'
  recarregar: () => void
  recarregando: boolean
  // categorias
  categorias: Categoria[]
  carregandoCategorias: boolean
  erroCategorias: boolean
  recarregarCategorias: () => void
  // envio
  enviando: boolean
  errosDoServidor: ErroDeCampo[]
  salvar: (dados: LancamentoFormDados) => void
  semConexao: boolean
  // criar categoria pelo campo
  novaCategoria: NovaCategoria
  criandoCategoria: boolean
  abrirNovaCategoria: (texto: string, selecionar: (id: number) => void) => void
  criarCategoria: (descricao: string) => void
  fecharNovaCategoria: () => void
  // alterações não salvas
  sujo: boolean
  setSujo: (sujo: boolean) => void
  descarteAberto: boolean
  confirmarDescarte: () => void
  cancelarDescarte: () => void
  limpar: () => void
  // lixeira
  moverParaLixeira: () => void
  restaurar: () => void
  restaurando: boolean
  hrefLista: string
}

const LancamentoFormContext = createContext<LancamentoFormContextValue | null>(null)

const nada = () => () => {}

function valoresDoLancamento(lancamento: Lancamento): LancamentoFormValores {
  return {
    descricao: lancamento.descricao,
    tipo: lancamento.tipo,
    data: lancamento.data,
    valor: lancamento.valor,
    categoriaIds: lancamento.categorias.map((c) => c.id),
    contaNoSaldo: lancamento.status === 'ATIVO',
  }
}

/** Lista do mês do lançamento salvo, para a pessoa já ver o que salvou */
function listaDoMes(data: string) {
  const { mes, ano } = partesDaData(data)
  return `${ROTAS.lancamentos}?${comPeriodo('', { mes, ano })}`
}

export type LancamentoFormProviderProps =
  | { modo: 'novo'; id?: undefined; children: ReactNode }
  | { modo: 'editar'; /** `null` quando o endereço não tem um id válido */ id: number | null; children: ReactNode }

export function LancamentoFormProvider({ modo, id, children }: LancamentoFormProviderProps) {
  const router = useRouter()
  // Hoje só no navegador (no servidor não há "hoje" de quem vê): até lá, a View mostra o esqueleto
  const hoje = useSyncExternalStore(nada, hojeIso, () => null)
  const tablet = useMediaQuery(MIDIA.tablet)
  const semConexao = !useOnline()

  const idValido = modo === 'editar' && id !== null ? id : undefined
  const consulta = useLancamento(idValido)
  const consultaCategorias = useCategorias()
  const salvarLancamento = useSalvarLancamento()
  const alterarStatus = useAlterarStatusLancamento()
  const salvarCategoria = useSalvarCategoria()
  const { adiar, desfazer, confirmar } = useMoverParaLixeiraAdiado()
  const restaurarLancamento = useRestaurarLancamento()

  const [versaoDoFormulario, setVersao] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [errosDoServidor, setErrosDoServidor] = useState<ErroDeCampo[]>([])
  const [novaCategoria, setNovaCategoria] = useState<NovaCategoria>({ aberto: false, nome: '', erro: null })
  const [selecionarCriada, setSelecionarCriada] = useState<{ fn: (id: number) => void } | null>(null)
  const [criadas, setCriadas] = useState<Categoria[]>([])
  const [sujo, setSujoEstado] = useState(false)
  const [pedido, setPedido] = useState<PedidoDeSaida | null>(null)

  const setSujo = useCallback((valor: boolean) => setSujoEstado(valor), [])
  const { liberar } = useAvisoAoSair(sujo, setPedido)

  const lancamento = consulta.data
  const erroLancamento = consulta.error
  let estado: EstadoDaTela
  if (modo === 'novo') estado = hoje ? 'pronto' : 'carregando'
  else if (idValido === undefined) estado = 'nao-encontrado'
  else if (erroLancamento)
    estado = erroLancamento instanceof ErroApi && erroLancamento.status === 404 ? 'nao-encontrado' : 'erro'
  else if (!lancamento || !hoje) estado = 'carregando'
  else estado = lancamento.status === 'DELETADO' ? 'lixeira' : 'pronto'

  const valoresIniciais = useMemo<LancamentoFormValores | null>(() => {
    if (!hoje) return null
    if (modo === 'novo')
      return { descricao: '', tipo: null, data: hoje, valor: null, categoriaIds: [], contaNoSaldo: true }
    return lancamento ? valoresDoLancamento(lancamento) : null
  }, [modo, hoje, lancamento])

  // As categorias da API + as que acabaram de ser criadas (até a lista recarregar) + as do lançamento (enquanto carrega)
  const categorias = useMemo<Categoria[]>(() => {
    const lista: Categoria[] = [...(consultaCategorias.data ?? [])]
    const extras: Categoria[] = [...criadas, ...(lancamento?.categorias ?? []).map((c) => ({ ...c, ativa: true }))]
    for (const extra of extras) if (!lista.some((c) => c.id === extra.id)) lista.push(extra)
    return lista
  }, [consultaCategorias.data, criadas, lancamento])

  const hrefLista = lancamento ? listaDoMes(lancamento.data) : ROTAS.lancamentos

  const sair = (destino: string) => {
    liberar()
    // replace: a guarda do histórico (e o formulário já salvo) não ficam no Voltar
    router.replace(destino)
  }

  const tratarErroDoEnvio = (erro: unknown, dados: LancamentoFormDados) => {
    if (erro instanceof ErroApi) {
      if (erro.status === 401) return // o AppProviders leva ao login
      if (erro.status === 400 && erro.erros.length > 0) {
        setErrosDoServidor(erro.erros)
        toast.error(MENSAGENS_FORMULARIO.confiraCampos)
        return
      }
      if (erro.status === 422 && !erro.erros.length) {
        toast.error(MENSAGENS_FORMULARIO.categoriaInativa)
        return
      }
      if (erro.status === 404) {
        toast.error(MENSAGENS_FORMULARIO.categoriaInexistente)
        return
      }
    }
    toast.error(MENSAGENS_FORMULARIO.erroSalvar, {
      action: { label: 'Tentar de novo', onClick: () => salvar(dados) },
    })
  }

  async function salvar(dados: LancamentoFormDados) {
    if (enviando || semConexao) return
    const { contaNoSaldo, ...corpo } = dados
    const statusDesejado: Exclude<StatusLancamento, 'DELETADO'> = contaNoSaldo ? 'ATIVO' : 'INATIVO'
    setEnviando(true)
    setErrosDoServidor([])
    try {
      const salvo = await salvarLancamento.mutateAsync(
        modo === 'editar' && idValido ? { ...corpo, id: idValido } : corpo,
      )
      // "Conta no saldo" não vai no POST/PUT: o lançamento novo nasce ATIVO; a mudança vai pelo PATCH de status
      if (salvo.status !== statusDesejado) await alterarStatus.mutateAsync({ id: salvo.id, status: statusDesejado })
      toast.success(MENSAGENS_FORMULARIO.salvo)
      sair(listaDoMes(salvo.data))
    } catch (erro) {
      tratarErroDoEnvio(erro, dados)
    } finally {
      setEnviando(false)
    }
  }

  const abrirNovaCategoria = (texto: string, selecionar: (idCategoria: number) => void) => {
    setSelecionarCriada({ fn: selecionar })
    setNovaCategoria({ aberto: true, nome: texto, erro: null })
  }

  const fecharNovaCategoria = () => setNovaCategoria((atual) => ({ ...atual, aberto: false, erro: null }))

  const criarCategoria = (descricao: string) => {
    setNovaCategoria((atual) => ({ ...atual, erro: null }))
    salvarCategoria.mutate(
      { descricao },
      {
        onSuccess: (criada) => {
          setCriadas((atuais) => [...atuais, criada])
          selecionarCriada?.fn(criada.id)
          fecharNovaCategoria()
          toast.success(MENSAGENS_FORMULARIO.categoriaCriada(criada.descricao))
        },
        onError: (erro) => {
          // 409 e 400 vão para o campo Nome, como nos outros diálogos de categoria (lib/erro-categoria)
          const doCampo = erroDoNomeDaCategoria(erro)
          if (doCampo) {
            setNovaCategoria((atual) => ({ ...atual, erro: doCampo }))
          } else if (!(erro instanceof ErroApi && erro.status === 401)) {
            toast.error(MENSAGENS_FORMULARIO.erroCategoria)
          }
        },
      },
    )
  }

  const limpar = () => {
    const recomecar = () => {
      setErrosDoServidor([])
      setVersao((v) => v + 1)
    }
    if (sujo) setPedido({ descartar: recomecar })
    else recomecar()
  }

  const confirmarDescarte = () => {
    const atual = pedido
    setPedido(null)
    atual?.descartar()
  }

  const cancelarDescarte = () => {
    const atual = pedido
    setPedido(null)
    atual?.cancelar?.()
  }

  const moverParaLixeira = () => {
    if (!idValido) return
    // Mesma fila da lista (hooks/use-lixeira-adiada): a linha some na hora e o DELETE só sai quando o toast fecha sem Desfazer
    adiar(idValido)
    mostrarToastDesfazer({
      mensagem: MENSAGENS_FORMULARIO.movido,
      onDesfazer: () => desfazer(idValido),
      onFechar: () => void confirmar(idValido).catch(() => toast.error(MENSAGENS_FORMULARIO.erroMover)),
    })
    sair(hrefLista)
  }

  const restaurar = () => {
    if (!idValido) return
    restaurarLancamento.mutate(idValido, {
      onSuccess: () => toast.success(MENSAGENS_FORMULARIO.restaurado),
      onError: (erro) => {
        if (!(erro instanceof ErroApi && erro.status === 401)) toast.error(MENSAGENS_FORMULARIO.erroRestaurar)
      },
    })
  }

  const valor: LancamentoFormContextValue = {
    modo,
    estado,
    lancamento,
    valoresIniciais,
    versaoDoFormulario,
    hoje,
    apresentacaoData: tablet ? 'popover' : 'folha',
    recarregar: () => void consulta.refetch(),
    recarregando: consulta.isFetching,
    categorias,
    carregandoCategorias: consultaCategorias.isPending,
    erroCategorias: consultaCategorias.isError,
    recarregarCategorias: () => void consultaCategorias.refetch(),
    enviando,
    errosDoServidor,
    salvar: (dados) => void salvar(dados),
    semConexao,
    novaCategoria,
    criandoCategoria: salvarCategoria.isPending,
    abrirNovaCategoria,
    criarCategoria,
    fecharNovaCategoria,
    sujo,
    setSujo,
    descarteAberto: pedido !== null,
    confirmarDescarte,
    cancelarDescarte,
    limpar,
    moverParaLixeira,
    restaurar,
    restaurando: restaurarLancamento.isPending,
    hrefLista,
  }

  return <LancamentoFormContext.Provider value={valor}>{children}</LancamentoFormContext.Provider>
}

export function useLancamentoFormContext() {
  const contexto = useContext(LancamentoFormContext)
  if (!contexto) throw new Error('useLancamentoFormContext precisa estar dentro de <LancamentoFormProvider>')
  return contexto
}
