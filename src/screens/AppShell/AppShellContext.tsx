'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { MIDIA, useMediaQuery } from '@/hooks/use-media-query'
import { useUsuario } from '@/hooks/use-usuario'
import { gravarSidebarRecolhida } from '@/lib/sidebar-cookie'
import type { Usuario } from '@/types/api'

// Estado da casca da área logada: sidebar (recolhida no computador, aberta por cima no tablet), rota ativa e usuário.
type AppShellContextValue = {
  /** Caminho atual (para marcar o item ativo da navegação) */
  caminho: string
  /** Preferência do computador, salva no cookie `sidebar` */
  recolhida: boolean
  /** Tablet: sidebar aberta por cima do conteúdo */
  aberta: boolean
  /** Sidebar mostrando os nomes agora (para o `aria-expanded` do botão de alternar) */
  expandida: boolean
  /** Botão `panel-left`: no computador recolhe/expande (e grava o cookie); no tablet abre/fecha por cima */
  alternarSidebar: () => void
  /** Véu, Esc ou escolha de um item */
  fecharSidebar: () => void
  usuario: Usuario | undefined
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ sidebarRecolhida, children }: { sidebarRecolhida: boolean; children: ReactNode }) {
  const caminho = usePathname()
  const computador = useMediaQuery(MIDIA.computador)
  const [recolhida, setRecolhida] = useState(sidebarRecolhida)
  const [aberta, setAberta] = useState(false)
  const { data: usuario } = useUsuario()

  function alternarSidebar() {
    if (computador) {
      const nova = !recolhida
      setRecolhida(nova)
      gravarSidebarRecolhida(nova)
    } else {
      setAberta((atual) => !atual)
    }
  }

  const valor: AppShellContextValue = {
    caminho,
    recolhida,
    aberta,
    expandida: computador ? !recolhida : aberta,
    alternarSidebar,
    fecharSidebar: () => setAberta(false),
    usuario,
  }

  return <AppShellContext.Provider value={valor}>{children}</AppShellContext.Provider>
}

export function useAppShellContext() {
  const contexto = useContext(AppShellContext)
  if (!contexto) throw new Error('useAppShellContext precisa estar dentro de <AppShellProvider>')
  return contexto
}
