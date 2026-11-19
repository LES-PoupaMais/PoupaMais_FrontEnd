import { Suspense } from 'react'
import { LancamentoFormProvider, LancamentoFormSkeleton, LancamentoFormView } from '@/screens/LancamentoForm'

// Só rota: Novo lançamento
export default function NovoLancamentoPage() {
  return (
    <Suspense fallback={<LancamentoFormSkeleton />}>
      <LancamentoFormProvider modo="novo">
        <LancamentoFormView />
      </LancamentoFormProvider>
    </Suspense>
  )
}
