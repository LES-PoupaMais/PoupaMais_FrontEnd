import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import { COOKIE_SIDEBAR, lerSidebarRecolhida } from '@/lib/sidebar-cookie'
import { AppShellProvider } from './AppShellContext'
import { AppShellView } from './AppShellView'

// Server Component: lê o cookie da sidebar no servidor, para a página já chegar no modo certo (sem piscar).
// Lê cookies(): quem usa fica dentro de <Suspense> (cacheComponents), como faz o app/(app)/layout.tsx.
export async function AppShell({ children }: { children: ReactNode }) {
  const loja = await cookies()
  return (
    <AppShellProvider sidebarRecolhida={lerSidebarRecolhida(loja.get(COOKIE_SIDEBAR)?.value)}>
      <AppShellView>{children}</AppShellView>
    </AppShellProvider>
  )
}
