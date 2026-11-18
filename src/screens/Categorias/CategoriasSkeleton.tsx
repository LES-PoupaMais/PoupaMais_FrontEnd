import { Skeleton } from '@/components/atoms/skeleton'

// Fallback do <Suspense> da rota e estado "carregando" da lista
export function CategoriasSkeleton({ somenteLista = false }: { somenteLista?: boolean }) {
  const lista = (
    <div aria-busy="true" aria-label="Carregando categorias" className="flex flex-col gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="rounded-card h-80 w-full" />
    </div>
  )
  if (somenteLista) return lista
  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="rounded-pilula h-12 w-full md:w-48" />
      {lista}
    </div>
  )
}
