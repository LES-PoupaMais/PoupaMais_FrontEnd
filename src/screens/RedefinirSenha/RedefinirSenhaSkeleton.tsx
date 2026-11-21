import { Skeleton } from '@/components/atoms/skeleton'
import { AuthTemplate } from '@/components/templates/auth-template'

// Fallback do <Suspense> da rota (enquanto o token da URL chega)
export function RedefinirSenhaSkeleton() {
  return (
    <AuthTemplate titulo="Criar nova senha">
      <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-4">
        <Skeleton className="rounded-campo h-11 w-full" />
        <Skeleton className="rounded-campo h-11 w-full" />
        <Skeleton className="rounded-pilula h-12 w-full" />
      </div>
    </AuthTemplate>
  )
}
