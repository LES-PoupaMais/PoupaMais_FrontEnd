import { Suspense } from 'react'
import { CategoriasProvider, CategoriasSkeleton, CategoriasView } from '@/screens/Categorias'

// Só rota. O mês da contagem vem da URL (?mes&ano, opcional) e o Context lê com useSearchParams, que pede <Suspense>.
export default function CategoriasPage() {
  return (
    <Suspense fallback={<CategoriasSkeleton />}>
      <CategoriasProvider>
        <CategoriasView />
      </CategoriasProvider>
    </Suspense>
  )
}
