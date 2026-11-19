'use client'

import { RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { mostrarToastDesfazer } from '@/components/molecules/undo-toast'
import { ROTAS } from '@/constants/rotas'
import { useConexao } from '@/hooks/use-conexao'
import { useLancamento } from '@/hooks/use-lancamentos'
import { useMoverParaLixeiraAdiado } from '@/hooks/use-lixeira-adiada'
import { useAlterarStatusLancamento, useRestaurarLancamento } from '@/hooks/use-mutacoes-lancamento'
import { ErroApi } from '@/lib/http'
import { partesDaData } from '@/lib/data'
import type { Lancamento } from '@/types/api'

// Visualizar lançamento em tela cheia (`/lancamentos/[id]`, o destino do toque na linha no celular; também abre direto por
// link no computador). Editar leva ao formulário; Mover para a lixeira volta para a lista do mês com o toast Desfazer;
// na lixeira, Restaurar.

type LancamentoDetalheContextValue = {
  lancamento: Lancamento | undefined
  carregando: boolean
  naoEncontrado: boolean
  erro: boolean
  tentarDeNovo: () => void
  tentando: boolean
  online: boolean
  /** Para onde o "‹" volta: a lista do mês do lançamento ou a Lixeira */
  voltar: { href: string; rotulo: string }
  alterandoSaldo: boolean
  alternarSaldo: (contaNoSaldo: boolean) => void
  moverParaLixeira: () => void
  restaurando: boolean
  restaurar: () => void
}

const LancamentoDetalheContext = createContext<LancamentoDetalheContextValue | null>(null)

function listaDoMes(lancamento: Lancamento | undefined) {
  if (!lancamento) return ROTAS.lancamentos
  const { mes, ano } = partesDaData(lancamento.data)
  return `${ROTAS.lancamentos}?mes=${mes}&ano=${ano}`
}

export function LancamentoDetalheProvider({ id, children }: { id: number; children: ReactNode }) {
  const router = useRouter()
  const online = useConexao()
  const consulta = useLancamento(Number.isInteger(id) && id > 0 ? id : undefined)
  const [statusOtimista, setStatusOtimista] = useState<Lancamento['status'] | null>(null)
  const bruto = consulta.data
  const lancamento = bruto && statusOtimista ? { ...bruto, status: statusOtimista } : bruto

  const alterarStatus = useAlterarStatusLancamento()
  const alternarSaldo = (contaNoSaldo: boolean) => {
    if (!lancamento) return
    const status = contaNoSaldo ? 'ATIVO' : 'INATIVO'
    setStatusOtimista(status)
    alterarStatus.mutate(
      { id: lancamento.id, status },
      {
        onSuccess: () =>
          toast.success(
            contaNoSaldo ? 'Lançamento de volta ao saldo' : 'Lançamento fora do saldo. Ele continua na lista.',
          ),
        onError: () => toast.error('Não foi possível mudar Conta no saldo.'),
        onSettled: () => setStatusOtimista(null),
      },
    )
  }

  const { adiar, desfazer, confirmar } = useMoverParaLixeiraAdiado()
  const moverParaLixeira = () => {
    if (!lancamento) return
    const { id: idLancamento } = lancamento
    adiar(idLancamento)
    mostrarToastDesfazer({
      mensagem: 'Movido para a lixeira',
      onDesfazer: () => desfazer(idLancamento),
      onFechar: () => void confirmar(idLancamento).catch(() => toast.error('Não foi possível mover para a lixeira.')),
    })
    router.push(listaDoMes(lancamento))
  }

  const restaurarMutation = useRestaurarLancamento()
  const restaurar = () => {
    if (!lancamento) return
    restaurarMutation.mutate(lancamento.id, {
      onSuccess: () =>
        toast('Restaurado como inativo. Ative para voltar ao dashboard.', {
          icon: <RotateCcw className="size-5" aria-hidden="true" />,
        }),
      onError: () => toast.error('Não foi possível restaurar.'),
    })
  }

  const naoEncontrado =
    !Number.isInteger(id) || id <= 0 || (consulta.error instanceof ErroApi && consulta.error.status === 404)
  const naLixeira = lancamento?.status === 'DELETADO'

  const valor: LancamentoDetalheContextValue = {
    lancamento,
    carregando: !naoEncontrado && consulta.isPending,
    naoEncontrado,
    erro: !naoEncontrado && consulta.isError && !consulta.data,
    tentarDeNovo: () => void consulta.refetch(),
    tentando: consulta.isRefetching,
    online,
    voltar: naLixeira
      ? { href: ROTAS.lixeira, rotulo: 'Lixeira' }
      : { href: listaDoMes(lancamento), rotulo: 'Lançamentos' },
    alterandoSaldo: statusOtimista !== null,
    alternarSaldo,
    moverParaLixeira,
    restaurando: restaurarMutation.isPending,
    restaurar,
  }
  return <LancamentoDetalheContext.Provider value={valor}>{children}</LancamentoDetalheContext.Provider>
}

export function useLancamentoDetalheContext() {
  const contexto = useContext(LancamentoDetalheContext)
  if (!contexto) throw new Error('useLancamentoDetalheContext precisa estar dentro de <LancamentoDetalheProvider>')
  return contexto
}
