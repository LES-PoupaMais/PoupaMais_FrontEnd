'use client'

import type { KeyboardEvent, ReactNode } from 'react'

// Casca da área logada (DS: Navegação e layout). Só layout: quem decide o estado é a tela (screens/AppShell).
// 'use client' só porque repassa os eventos do véu e do Esc (sem estado nem efeito).
// - < 768px: sem sidebar; `header` (TopBar) fixo no topo e `bottomNav` fixa embaixo.
// - 768–1023px (tablet): sidebar no modo trilho (72px). `aberta` abre a sidebar POR CIMA do conteúdo, com véu.
// - ≥ 1024px (computador): sidebar expandida (256px) empurrando o conteúdo; `recolhida` vira trilho e o conteúdo ganha largura.
// O organismo da sidebar usa a variante `trilho:` (globals.css) para esconder os nomes no modo trilho.
// Sem `sidebar` nem `bottomNav`, vira a casca simples (futura visualização por link): só o conteúdo centralizado.
export type AppShellTemplateProps = {
  children: ReactNode
  /** Organismo Sidebar (≥ 768px) */
  sidebar?: ReactNode
  /** Organismo BottomNav (< 768px). Telas de formulário podem não passar, para dar espaço ao teclado. */
  bottomNav?: ReactNode
  /** Organismo TopBar (< 768px) */
  header?: ReactNode
  /** Preferência do computador (cookie `sidebar`): sidebar recolhida no trilho */
  recolhida?: boolean
  /** Tablet: sidebar aberta por cima do conteúdo */
  aberta?: boolean
  /** Véu ou Esc com a sidebar aberta no tablet */
  onFecharSidebar?: () => void
  /** id do <aside>, para o `aria-controls` do botão de alternar */
  idSidebar?: string
}

export function AppShellTemplate({
  children,
  sidebar,
  bottomNav,
  header,
  recolhida = false,
  aberta = false,
  onFecharSidebar,
  idSidebar = 'sidebar',
}: AppShellTemplateProps) {
  const comSidebar = Boolean(sidebar)

  function fecharComEsc(evento: KeyboardEvent) {
    if (aberta && evento.key === 'Escape') onFecharSidebar?.()
  }

  return (
    <div
      data-slot="app-shell"
      data-sidebar-recolhida={recolhida}
      data-sidebar-aberta={aberta}
      className="group/app-shell bg-background text-foreground min-h-screen"
      onKeyDown={fecharComEsc}
    >
      <a
        href="#conteudo"
        className="bg-primary text-primary-foreground rounded-pilula sr-only z-50 px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>

      {comSidebar && (
        <aside
          id={idSidebar}
          data-slot="app-shell-sidebar"
          className="bg-sidebar text-sidebar-foreground border-sidebar-border w-trilho lg:w-sidebar md:max-lg:group-data-[sidebar-aberta=true]/app-shell:w-sidebar md:max-lg:group-data-[sidebar-aberta=true]/app-shell:shadow-flutuante lg:group-data-[sidebar-recolhida=true]/app-shell:w-trilho fixed inset-y-0 left-0 z-40 hidden flex-col overflow-x-hidden overflow-y-auto border-r transition-[width] duration-200 md:flex"
        >
          {sidebar}
        </aside>
      )}

      {comSidebar && aberta && (
        // Véu do tablet: o clique fecha; pelo teclado, o Esc (tratado acima) faz o mesmo
        <div
          data-slot="app-shell-veu"
          aria-hidden="true"
          className="bg-sobreposicao fixed inset-0 z-30 hidden md:block lg:hidden"
          onClick={onFecharSidebar}
        />
      )}

      <div
        data-slot="app-shell-area"
        data-com-sidebar={comSidebar}
        className="md:data-[com-sidebar=true]:pl-trilho lg:data-[com-sidebar=true]:pl-sidebar lg:group-data-[sidebar-recolhida=true]/app-shell:data-[com-sidebar=true]:pl-trilho flex min-h-screen flex-col transition-[padding] duration-200"
      >
        {header && (
          <div data-slot="app-shell-header" className="sticky top-0 z-20 md:hidden">
            {header}
          </div>
        )}

        <main
          id="conteudo"
          data-com-bottom-nav={Boolean(bottomNav)}
          className="max-w-conteudo mx-auto w-full flex-1 px-5 py-6 data-[com-bottom-nav=true]:pb-[calc(var(--barra-inferior)+env(safe-area-inset-bottom)+24px)] md:px-8 md:py-8 md:data-[com-bottom-nav=true]:pb-8"
        >
          {children}
        </main>
      </div>

      {bottomNav && (
        <div data-slot="app-shell-bottom-nav" className="fixed inset-x-0 bottom-0 z-30 md:hidden">
          {bottomNav}
        </div>
      )}
    </div>
  )
}
