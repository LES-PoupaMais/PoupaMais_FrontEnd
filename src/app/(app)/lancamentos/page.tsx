import { Suspense } from 'react'
import { LancamentosProvider, LancamentosSkeleton, LancamentosView } from '@/screens/Lancamentos'

// Só rota. Mês e filtros ficam na URL (?mes=11&ano=2026&tipo=…); o Context lê com useSearchParams, que pede <Suspense>.
export default function LancamentosPage() {
  return (
    <Suspense fallback={<LancamentosSkeleton />}>
      <LancamentosProvider>
        <LancamentosView />
      </LancamentosProvider>
    </Suspense>
  )
}
