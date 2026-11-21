'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { ErrorState } from '@/components/molecules/error-state'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { TransactionDetail, TransactionDetailSkeleton } from '@/components/organisms/transaction-detail'
import { ROTAS } from '@/constants/rotas'
import { LANCAMENTO_NAO_ENCONTRADO } from '@/constants/textos'
import { useLancamentoDetalheContext } from './LancamentoDetalheContext'

const ID_MOTIVO_OFFLINE = 'detalhe-offline-motivo'

// Celular: barra própria com o "‹" (a casca esconde a TopBar nesta rota); a visualização em tela cheia, com as ações embaixo.
// Tablet e computador (link direto): "‹ Lançamentos" acima e a visualização num card de 640px centralizado.
export function LancamentoDetalheView() {
  const ctx = useLancamentoDetalheContext()
  const { lancamento, online } = ctx
  const motivo = online ? undefined : ID_MOTIVO_OFFLINE

  if (ctx.naoEncontrado)
    return (
      <ErrorState
        tipo="nao-encontrado"
        titulo={LANCAMENTO_NAO_ENCONTRADO.titulo}
        texto={LANCAMENTO_NAO_ENCONTRADO.texto}
        href={ROTAS.lancamentos}
        rotuloAcao="Ver lançamentos"
      />
    )

  return (
    // Celular: o fundo branco vai até a barra inferior (altura da tela menos a barra e os 24px de respiro de cima e de baixo)
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 max-md:min-h-[calc(100dvh-var(--barra-inferior)-env(safe-area-inset-bottom)-3rem)]">
      {/* Celular: barra branca no topo com "‹ Lançamentos" ou "‹ Lixeira" (prancheta lixeira-detalhe-celular; a casca não
          mostra a TopBar nesta rota, porque só a tela sabe o status). Tablet e computador: o link acima do card. */}
      <div className="bg-card border-border sticky top-0 z-20 -mx-5 -mt-6 flex min-h-14 items-center border-b px-2 md:static md:m-0 md:block md:min-h-0 md:border-0 md:bg-transparent md:p-0">
        <Button asChild variant="texto" className="px-2 md:-ml-3 md:px-3">
          <Link href={ctx.voltar.href}>
            <ChevronLeft aria-hidden="true" />
            {ctx.voltar.rotulo}
          </Link>
        </Button>
      </div>
      <section
        aria-label="Lançamento"
        className="bg-card md:rounded-grande md:border-border md:shadow-card -mx-5 -mt-4 -mb-6 p-5 max-md:flex-1 md:mx-0 md:my-0 md:border md:p-6"
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
