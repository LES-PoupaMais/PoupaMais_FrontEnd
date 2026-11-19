import { Skeleton } from '@/components/atoms/skeleton'

/** Cards (celular e tablet) e tabela (computador) carregando */
export function LixeiraListaSkeleton() {
  return (
    <div
      data-slot="lixeira-carregando"
      aria-busy="true"
      aria-label="Carregando a lixeira"
      className="flex flex-col gap-3"
    >
      <Skeleton className="rounded-campo h-12" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="rounded-card h-28 lg:h-14" />
      ))}
    </div>
  )
}

/** Fallback do <Suspense> da rota */
export function LixeiraSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="hidden flex-col gap-2 md:flex">
        <Skeleton forma="titulo" className="w-32" />
        <Skeleton forma="texto" className="w-80" />
      </div>
      <LixeiraListaSkeleton />
    </div>
  )
}
