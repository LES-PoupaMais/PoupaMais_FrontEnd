import { Skeleton } from '@/components/atoms/skeleton'

/** Cards (celular e tablet) e tabela (computador) carregando, com as medidas do conteúdo real */
export function LancamentosListaSkeleton() {
  return (
    <div data-slot="lancamentos-carregando" aria-busy="true" aria-label="Carregando lançamentos">
      <ul className="m-0 flex list-none flex-col gap-2 p-0 lg:hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="rounded-card border-border bg-card flex min-h-18 items-start gap-3 border px-4 py-3">
            <Skeleton forma="icone" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <Skeleton forma="texto" className="w-3/5" />
              <Skeleton forma="texto" className="w-2/5" />
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-card border-border bg-card shadow-card hidden flex-col gap-3 border p-5 lg:flex">
        <Skeleton forma="titulo" className="w-40" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    </div>
  )
}

/** Fallback do <Suspense> da rota (enquanto os searchParams chegam) */
export function LancamentosSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="hidden flex-col gap-2 md:flex">
        <Skeleton forma="titulo" className="w-48" />
        <Skeleton forma="texto" className="w-64" />
      </div>
      <Skeleton className="rounded-card h-11 md:h-32" />
      <LancamentosListaSkeleton />
    </div>
  )
}
