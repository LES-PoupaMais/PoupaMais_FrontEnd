import { Suspense } from 'react'
import {
  LancamentoDetalheProvider,
  LancamentoDetalheSkeleton,
  LancamentoDetalheView,
} from '@/screens/LancamentoDetalhe'

// Só rota: visualizar um lançamento (tela cheia no celular). O `params` é uma Promise (Next 16), lida dentro do <Suspense>.
export default function LancamentoPage({ params }: PageProps<'/lancamentos/[id]'>) {
  return (
    <Suspense fallback={<LancamentoDetalheSkeleton />}>
      <LancamentoDetalhe params={params} />
    </Suspense>
  )
}

async function LancamentoDetalhe({ params }: Pick<PageProps<'/lancamentos/[id]'>, 'params'>) {
  const { id } = await params
  return (
    <LancamentoDetalheProvider id={Number(id)}>
      <LancamentoDetalheView />
    </LancamentoDetalheProvider>
  )
}
