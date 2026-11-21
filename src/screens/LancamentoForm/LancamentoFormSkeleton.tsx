import { Skeleton } from '@/components/atoms/skeleton'
import { FormPageTemplate } from '@/components/templates/form-page-template'

// Fallback do <Suspense> e estado "carregando" (Editar busca o lançamento): os blocos dos campos.
export function LancamentoFormSkeleton({ titulo = 'Novo lançamento' }: { titulo?: string }) {
  return (
    <FormPageTemplate titulo={titulo}>
      <div aria-busy="true" aria-label="Carregando o formulário" className="flex flex-col gap-5">
        <Skeleton className="h-4 w-48" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-8 w-40" />
      </div>
    </FormPageTemplate>
  )
}
