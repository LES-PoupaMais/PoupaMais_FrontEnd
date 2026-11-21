import { Suspense, type ReactNode } from 'react'
import { AppShell, AppShellSkeleton } from '@/screens/AppShell'

// Casca da área logada (sidebar, barra inferior e topo), que persiste entre as telas.
// O AppShell lê o cookie da sidebar no servidor; por isso fica dentro de <Suspense> (cacheComponents).
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}
