'use client'

import type { ReactNode } from 'react'
import { BottomNavProvisoria, SidebarProvisoria, TopBarProvisoria } from '@/components/organisms/navegacao-provisoria'
import { AppShellTemplate } from '@/components/templates/app-shell-template'
import { GRUPOS_SIDEBAR, ITENS_BOTTOM_NAV, itemAtivo, TITULOS_TOPBAR } from '@/constants/navegacao'
import { ROTAS } from '@/constants/rotas'
import { useAppShellContext } from './AppShellContext'

const ID_SIDEBAR = 'sidebar'
const ITENS_SIDEBAR = GRUPOS_SIDEBAR.flatMap((grupo) => grupo.itens)
// Telas de formulário escondem a barra inferior (o rodapé fixo com "Salvar" ocupa o lugar)
const ROTAS_SEM_BARRA_INFERIOR = /^\/lancamentos\/(novo|\d+\/editar)$/

// Liga o Context ao AppShellTemplate. Por enquanto com a navegação PROVISÓRIA; o B2 troca pelos organismos
// sidebar, bottom-nav, top-bar e create-sheet, sem mudar o template nem o Context.
export function AppShellView({ children }: { children: ReactNode }) {
  const { caminho, recolhida, aberta, expandida, alternarSidebar, fecharSidebar } = useAppShellContext()
  const titulo = TITULOS_TOPBAR[itemAtivo(ITENS_SIDEBAR, caminho) ?? ''] ?? 'PoupaMais'

  return (
    <AppShellTemplate
      idSidebar={ID_SIDEBAR}
      recolhida={recolhida}
      aberta={aberta}
      onFecharSidebar={fecharSidebar}
      header={<TopBarProvisoria titulo={titulo} />}
      sidebar={
        <SidebarProvisoria
          grupos={GRUPOS_SIDEBAR}
          ativo={itemAtivo(ITENS_SIDEBAR, caminho)}
          expandida={expandida}
          onAlternar={alternarSidebar}
          onNavegar={fecharSidebar}
          idSidebar={ID_SIDEBAR}
        />
      }
      bottomNav={
        ROTAS_SEM_BARRA_INFERIOR.test(caminho) ? undefined : (
          <BottomNavProvisoria
            itens={ITENS_BOTTOM_NAV}
            ativo={itemAtivo(ITENS_BOTTOM_NAV, caminho)}
            hrefCriar={ROTAS.novoLancamento}
          />
        )
      }
    >
      {children}
    </AppShellTemplate>
  )
}
