import { Skeleton } from '@/components/atoms/skeleton'
import { DashboardTemplate } from '@/components/templates/dashboard-template'

// Fallback do <Suspense> da rota (enquanto os searchParams chegam)
export function DashboardSkeleton() {
  return (
    <DashboardTemplate
      cabecalho={<Skeleton className="h-8 w-48" />}
      saldo={<Skeleton className="rounded-grande h-40" />}
      indicadores={
        <>
          <Skeleton className="rounded-card h-28" />
          <Skeleton className="rounded-card h-28" />
          <Skeleton className="rounded-card h-28" />
        </>
      }
      receitasDespesas={<Skeleton className="rounded-card h-72" />}
      saldoMensal={<Skeleton className="rounded-card h-72" />}
    />
  )
}
