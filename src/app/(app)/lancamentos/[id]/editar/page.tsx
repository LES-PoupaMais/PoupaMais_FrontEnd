import { Suspense } from 'react'
import { LancamentoFormProvider, LancamentoFormSkeleton, LancamentoFormView } from '@/screens/LancamentoForm'

// Só rota: Editar lançamento. `params` é Promise no Next 16 e fica dentro do <Suspense> (cacheComponents).
export default function EditarLancamentoPage({ params }: PageProps<'/lancamentos/[id]/editar'>) {
  return (
    <Suspense fallback={<LancamentoFormSkeleton titulo="Editar lançamento" />}>
      <Editar params={params} />
    </Suspense>
  )
}

async function Editar({ params }: Pick<PageProps<'/lancamentos/[id]/editar'>, 'params'>) {
  const { id } = await params
  const numero = /^\d+$/.test(id) ? Number(id) : null
  return (
    <LancamentoFormProvider modo="editar" id={numero}>
      <LancamentoFormView />
    </LancamentoFormProvider>
  )
}
