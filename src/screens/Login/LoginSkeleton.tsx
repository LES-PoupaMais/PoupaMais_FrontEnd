import { Skeleton } from '@/components/atoms/skeleton'
import { AuthTemplate } from '@/components/templates/auth-template'

// Fallback do <Suspense> da rota (enquanto os searchParams chegam)
export function LoginSkeleton() {
  return (
    <AuthTemplate titulo="Bem-vindo de volta" subtitulo="Entre na sua conta para continuar.">
      <div aria-busy="true" aria-label="Carregando" className="flex flex-col gap-4">
        <Skeleton className="rounded-campo h-11 w-full" />
        <Skeleton className="rounded-campo h-11 w-full" />
        <Skeleton className="rounded-pilula h-12 w-full" />
      </div>
    </AuthTemplate>
  )
}
