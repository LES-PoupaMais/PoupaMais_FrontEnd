'use client'

import { RotateCcw, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { toast } from 'sonner'
import { mostrarToastDesfazer } from '@/components/molecules/undo-toast'
import type { ErroDeCampo, LancamentoFormDados, LancamentoFormValores } from '@/components/organisms/lancamento-form'
import { ROTAS } from '@/constants/rotas'
import { textoRestaurado } from '@/constants/textos'
import { useCategorias, useSalvarCategoria } from '@/hooks/use-categorias'
import { useMoverParaLixeiraComDesfazer } from '@/hooks/use-lixeira'
import { useLancamento } from '@/hooks/use-lancamentos'
import { MIDIA, useMediaQuery } from '@/hooks/use-media-query'
import { useOnline } from '@/hooks/use-online'
import { useRestaurarLancamento, useSalvarLancamento } from '@/hooks/use-mutacoes-lancamento'
import { hojeIso, partesDaData } from '@/lib/data'
import { erroDoNomeDaCategoria } from '@/lib/erro-categoria'
import { ehSessaoVencida, ErroApi, traduzirErro } from '@/lib/http'
import { comPeriodo } from '@/lib/periodo'
import type { Categoria, Lancamento } from '@/types/api'
import { useAvisoAoSair, type PedidoDeSaida } from './useAvisoAoSair'

// Novo e Editar lançamento (pranchetas novo-*, editar-*, nova-categoria-inline-celular, novo-categorias-celular).
// Dados (lançamento e categorias), envio (POST/PUT com o status de "Conta no saldo" no mesmo corpo), criar categoria pelo campo,
// "Descartar alterações?", Mover para a lixeira (Desfazer) e Restaurar (lançamento na lixeira), com os toasts.

export const MENSAGENS_FORMULARIO = {
  salvo: 'Lançamento salvo',
  erroSalvar: 'Não foi possível salvar. O que você preencheu continua aqui.',
  confiraCampos: 'Confira os campos marcados.',
  categoriaCriada: (nome: string) => `Categoria "${nome}" criada`,
  erroCategoria: 'Não foi possível criar a categoria. Tente de novo.',
  movido: 'Movido para a lixeira',
  erroMover: 'Não foi possível mover para a lixeira. Tente de novo.',
  erroRestaurar: 'Não foi possível restaurar. Tente de novo.',
} as const

export type EstadoDaTela = 'carregando' | 'erro' | 'nao-encontrado' | 'lixeira' | 'pronto'

/** Diálogo de categoria do campo: criar (sem `categoria`) ou editar pelo lápis da lista (com `categoria`) */
type NovaCategoria = { aberto: boolean; nome: string; erro: string | null; categoria?: Categoria | null }

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
  /** Lápis de uma categoria na lista do campo: abre o diálogo de editar (renomear) */
  abrirEditarCategoria: (idCategoria: number) => void
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
  const salvarCategoria = useSalvarCategoria()
  const moverComDesfazer = useMoverParaLixeiraComDesfazer()
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

  // Regra de lib/http (19/11): `erros[]` com campo vão para os campos; a mensagem da API (ex.: categoria inativa ou
  // inexistente) vai no toast como veio; sem conexão, 5xx ou sem mensagem → a frase do formulário com "Tentar de novo".
  const tratarErroDoEnvio = (erro: unknown, dados: LancamentoFormDados) => {
    if (ehSessaoVencida(erro)) return // o AppProviders leva ao login
    const { status, mensagem, campos } = traduzirErro(erro)
    const doCampo = Object.entries(campos).map(([campo, texto]) => ({ campo, mensagem: texto }))
    if (doCampo.length > 0) {
      setErrosDoServidor(doCampo)
      toast.error(MENSAGENS_FORMULARIO.confiraCampos)
      return
    }
    if (erro instanceof ErroApi && erro.daApi && status >= 400 && status < 500) {
      toast.error(mensagem)
      return
    }
    // Toast de erro do DS: sem conexão (status 0, a requisição nem chegou) com o ícone de sem conexão; ação com ícone e sem ×
    toast.error(MENSAGENS_FORMULARIO.erroSalvar, {
      ...(status === 0 && { icon: <WifiOff strokeWidth={1.75} aria-hidden="true" /> }),
      closeButton: false,
      action: {
        label: (
          <>
            <RotateCcw aria-hidden="true" />
            Tentar de novo
          </>
        ),
        onClick: () => salvar(dados),
      },
    })
  }

  async function salvar(dados: LancamentoFormDados) {
    if (enviando || semConexao) return
    const { contaNoSaldo, ...resto } = dados
    // "Conta no saldo" vai no próprio POST/PUT (contrato v1.2.0): uma chamada só
    const corpo = { ...resto, status: contaNoSaldo ? ('ATIVO' as const) : ('INATIVO' as const) }
    setEnviando(true)
    setErrosDoServidor([])
    try {
      const salvo = await salvarLancamento.mutateAsync(
        modo === 'editar' && idValido ? { ...corpo, id: idValido } : corpo,
      )
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
    setNovaCategoria({ aberto: true, nome: texto, erro: null, categoria: null })
  }

  const abrirEditarCategoria = (idCategoria: number) => {
    const categoria = categorias.find((c) => c.id === idCategoria)
    if (categoria) setNovaCategoria({ aberto: true, nome: categoria.descricao, erro: null, categoria })
  }

  const fecharNovaCategoria = () => setNovaCategoria((atual) => ({ ...atual, aberto: false, erro: null }))

  const criarCategoria = (descricao: string) => {
    setNovaCategoria((atual) => ({ ...atual, erro: null }))
    const editada = novaCategoria.categoria
    salvarCategoria.mutate(editada ? { id: editada.id, descricao } : { descricao }, {
      onSuccess: (criada) => {
        if (editada) {
          fecharNovaCategoria()
          toast.success('Categoria renomeada')
          return
        }
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
        } else if (!ehSessaoVencida(erro)) {
          toast.error(traduzirErro(erro, { padrao: MENSAGENS_FORMULARIO.erroCategoria }).mensagem)
        }
      },
    })
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
    // Como na lista (hooks/use-lixeira): o DELETE vai na hora e o Desfazer do toast restaura
    const movido = moverComDesfazer(idValido, {
      onErroAoDesfazer: (erro) =>
        toast.error(traduzirErro(erro, { padrao: MENSAGENS_FORMULARIO.erroRestaurar }).mensagem),
    })
    const idToast = mostrarToastDesfazer({
      mensagem: MENSAGENS_FORMULARIO.movido,
      onDesfazer: () => void movido.desfazer(),
    })
    movido.envio.catch((erro: unknown) => {
      toast.dismiss(idToast)
      toast.error(traduzirErro(erro, { padrao: MENSAGENS_FORMULARIO.erroMover }).mensagem)
    })
    sair(hrefLista)
  }

  const restaurar = () => {
    if (!idValido) return
    restaurarLancamento.mutate(idValido, {
      onSuccess: (restaurado) => toast.success(textoRestaurado(restaurado.status)),
      onError: (erro) => {
        if (!ehSessaoVencida(erro))
          toast.error(traduzirErro(erro, { padrao: MENSAGENS_FORMULARIO.erroRestaurar }).mensagem)
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
    abrirEditarCategoria,
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
