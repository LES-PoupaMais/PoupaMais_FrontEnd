import { Suspense } from 'react'
import { LoginProvider, LoginSkeleton, LoginView } from '@/screens/Login'

// Só rota. searchParams é uma Promise (Next 16) e, com cacheComponents, quem a lê fica dentro de <Suspense>:
// a página repassa a Promise e o componente interno faz o await.
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <Login searchParams={searchParams} />
    </Suspense>
  )
}

async function Login({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { voltar, sessao } = await searchParams // /login?voltar=/lancamentos/novo&sessao=vencida
  return (
    <LoginProvider voltar={voltar} sessao={sessao}>
      <LoginView />
    </LoginProvider>
  )
}
