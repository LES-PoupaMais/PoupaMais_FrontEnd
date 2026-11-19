import { Suspense } from 'react'
import { PerfilProvider, PerfilSkeleton, PerfilView } from '@/screens/Perfil'

// Só rota. O Perfil não lê a URL, mas o Context usa useRouter e o tema do navegador: o <Suspense> segura o esqueleto.
export default function PerfilPage() {
  return (
    <Suspense fallback={<PerfilSkeleton />}>
      <PerfilProvider>
        <PerfilView />
      </PerfilProvider>
    </Suspense>
  )
}
