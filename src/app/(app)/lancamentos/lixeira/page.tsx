import { Suspense } from 'react'
import { LixeiraProvider, LixeiraSkeleton, LixeiraView } from '@/screens/Lixeira'

// Só rota. A Lixeira não depende do mês; o painel da visualização fica em ?ver=<id> (useSearchParams pede <Suspense>).
export default function LixeiraPage() {
  return (
    <Suspense fallback={<LixeiraSkeleton />}>
      <LixeiraProvider>
        <LixeiraView />
      </LixeiraProvider>
    </Suspense>
  )
}
