import { Skeleton } from '@/components/atoms/skeleton'
import { AppShellTemplate } from '@/components/templates/app-shell-template'

// Fallback do <Suspense> da área logada enquanto o cookie da sidebar é lido
export function AppShellSkeleton() {
  return (
    <AppShellTemplate>
      <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="rounded-card h-40 w-full" />
      </div>
    </AppShellTemplate>
  )
}
