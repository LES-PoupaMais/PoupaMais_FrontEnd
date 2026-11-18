import { Suspense } from 'react'
import { DashboardProvider, DashboardSkeleton, DashboardView } from '@/screens/Dashboard'

// Só rota. O mês fica na URL (?mes=11&ano=2026) e o Context lê com useSearchParams, que pede <Suspense>.
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardProvider>
        <DashboardView />
      </DashboardProvider>
    </Suspense>
  )
}
