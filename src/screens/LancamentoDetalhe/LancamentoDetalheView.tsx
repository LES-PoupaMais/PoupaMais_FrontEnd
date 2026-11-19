'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineBanner, OfflineMotivo } from '@/components/molecules/offline-banner'
import { TransactionDetail, TransactionDetailSkeleton } from '@/components/organisms/transaction-detail'
import { ROTAS } from '@/constants/rotas'
import { useLancamentoDetalheContext } from './LancamentoDetalheContext'

const ID_MOTIVO_OFFLINE = 'detalhe-offline-motivo'

// Celular: o título e o "‹" ficam na TopBar da casca; o conteúdo é a visualização em tela cheia, com as ações embaixo.
// Tablet e computador (link direto): "‹ Lançamentos" acima e a visualização num card de 640px centralizado.
export function LancamentoDetalheView() {
  const ctx = useLancamentoDetalheContext()
  const { lancamento, online } = ctx
  const motivo = online ? undefined : ID_MOTIVO_OFFLINE

  if (ctx.naoEncontrado)
    return (
      <ErrorState
        tipo="nao-encontrado"
        titulo="Lançamento não encontrado"
        texto="Ele pode ter sido apagado ou o endereço está errado."
        href={ROTAS.lancamentos}
        rotuloAcao="Ver lançamentos"
      />
    )

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
      {!online && <OfflineBanner variante="canto" />}
      <Button asChild variant="texto" className="-ml-3 hidden self-start md:inline-flex">
        <Link href={ctx.voltar.href}>
          <ChevronLeft aria-hidden="true" />
          {ctx.voltar.rotulo}
        </Link>
      </Button>
      <section
        aria-label="Lançamento"
        className="bg-card md:rounded-grande md:border-border md:shadow-card -mx-5 -my-6 p-5 md:mx-0 md:my-0 md:border md:p-6"
      >
        {ctx.carregando ? (
          <TransactionDetailSkeleton />
        ) : ctx.erro || !lancamento ? (
          <ErrorState semCartao onTentarDeNovo={ctx.tentarDeNovo} tentando={ctx.tentando} />
        ) : (
          <TransactionDetail
            lancamento={lancamento}
            nivelTitulo="h1"
            hrefEditar={ROTAS.editarLancamento(lancamento.id)}
            onAlternarSaldo={ctx.alternarSaldo}
            alterandoSaldo={ctx.alterandoSaldo}
            onMoverParaLixeira={ctx.moverParaLixeira}
            onRestaurar={ctx.restaurar}
            restaurando={ctx.restaurando}
            motivoDesabilitado={motivo}
            acaoExtra={
              lancamento.status === 'DELETADO' && (
                <Button asChild variant="texto">
                  <Link href={ROTAS.lixeira}>Ver a lixeira</Link>
                </Button>
              )
            }
          />
        )}
        {!online && <OfflineMotivo id={ID_MOTIVO_OFFLINE} className="mt-3" />}
      </section>
    </div>
  )
}
