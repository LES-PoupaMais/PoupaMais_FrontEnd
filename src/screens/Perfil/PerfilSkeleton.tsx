import type { ReactNode } from 'react'
import { Skeleton } from '@/components/atoms/skeleton'
import { PerfilTemplate } from '@/components/templates/perfil-template'

/** Esqueleto dos cards do Perfil (carregando o usuário), com o cabeçalho já escrito quando houver. */
export function PerfilColunasSkeleton({ cabecalho }: { cabecalho?: ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Carregando o perfil">
      <PerfilTemplate
        cabecalho={cabecalho ?? <Skeleton className="h-8 w-40" />}
        principal={
          <>
            <Skeleton className="rounded-card h-36" />
            <Skeleton className="rounded-card h-72" />
            <Skeleton className="rounded-card h-96" />
          </>
        }
        lateral={
          <>
            <Skeleton className="rounded-card h-40" />
            <Skeleton className="rounded-card h-48" />
            <Skeleton className="rounded-card h-56" />
          </>
        }
      />
    </div>
  )
}

/** Fallback do <Suspense> da rota */
export function PerfilSkeleton() {
  return <PerfilColunasSkeleton />
}
