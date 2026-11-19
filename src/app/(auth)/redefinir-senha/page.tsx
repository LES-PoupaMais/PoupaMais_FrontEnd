import { Suspense } from 'react'
import { RedefinirSenhaProvider, RedefinirSenhaSkeleton, RedefinirSenhaView } from '@/screens/RedefinirSenha'

// Só rota. O token do link do e-mail vem em ?token= (Promise no Next 16, lida dentro do <Suspense>).
export default function RedefinirSenhaPage({ searchParams }: PageProps<'/redefinir-senha'>) {
  return (
    <Suspense fallback={<RedefinirSenhaSkeleton />}>
      <RedefinirSenha searchParams={searchParams} />
    </Suspense>
  )
}

async function RedefinirSenha({ searchParams }: Pick<PageProps<'/redefinir-senha'>, 'searchParams'>) {
  const { token } = await searchParams
  return (
    <RedefinirSenhaProvider token={token}>
      <RedefinirSenhaView />
    </RedefinirSenhaProvider>
  )
}
