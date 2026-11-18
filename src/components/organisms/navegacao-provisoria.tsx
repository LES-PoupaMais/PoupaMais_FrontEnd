import { PanelLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/atoms/logo'
import type { GrupoNavegacao, ItemNavegacao } from '@/constants/navegacao'

// PROVISÓRIO (B1): navegação mínima só para a casca da área logada funcionar enquanto os organismos de verdade
// (sidebar, bottom-nav, top-bar e create-sheet, do B2) não existem. Quando eles chegarem, a tela AppShell passa a usá-los
// e ESTE ARQUIVO (com o teste) é apagado. Não use em outro lugar nem acrescente funcionalidade aqui.

export type SidebarProvisoriaProps = {
  grupos: GrupoNavegacao[]
  ativo?: string
  expandida: boolean
  onAlternar: () => void
  onNavegar?: () => void
  idSidebar?: string
}

export function SidebarProvisoria({
  grupos,
  ativo,
  expandida,
  onAlternar,
  onNavegar,
  idSidebar = 'sidebar',
}: SidebarProvisoriaProps) {
  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="trilho:flex-col trilho:gap-3 flex min-h-11 items-center justify-between gap-2">
        <Logo variante="sidebar" className="trilho:hidden" />
        <Logo variante="cofrinho" className="trilho:inline-flex hidden" />
        <button
          type="button"
          className="text-muted-foreground hover:bg-secondary rounded-pilula inline-flex size-11 items-center justify-center"
          aria-label={expandida ? 'Recolher menu' : 'Expandir menu'}
          aria-expanded={expandida}
          aria-controls={idSidebar}
          onClick={onAlternar}
        >
          <PanelLeft className="size-5" aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Navegação principal" className="flex flex-col gap-4">
        {grupos.map((grupo) => (
          <section key={grupo.titulo} aria-label={grupo.titulo} className="flex flex-col gap-1">
            <h2 className="text-rotulo-secao text-muted-foreground trilho:sr-only px-3 uppercase">{grupo.titulo}</h2>
            <ul className="flex flex-col gap-1">
              {grupo.itens.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.href === ativo ? 'page' : undefined}
                    className="text-muted-foreground hover:bg-secondary aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground rounded-campo trilho:justify-center flex min-h-11 items-center gap-3 px-3 font-semibold"
                    onClick={onNavegar}
                  >
                    <item.icone className="size-5 shrink-0" aria-hidden="true" />
                    <span className="trilho:sr-only">{item.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  )
}

export type BottomNavProvisoriaProps = { itens: ItemNavegacao[]; ativo?: string; hrefCriar: string }

export function BottomNavProvisoria({ itens, ativo, hrefCriar }: BottomNavProvisoriaProps) {
  const metade = Math.ceil(itens.length / 2)
  const link = (item: ItemNavegacao) => (
    <li key={item.href} className="flex-1">
      <Link
        href={item.href}
        aria-current={item.href === ativo ? 'page' : undefined}
        className="text-muted-foreground aria-[current=page]:text-primary text-mini flex min-h-11 flex-col items-center gap-1 py-2"
      >
        <item.icone className="size-5" aria-hidden="true" />
        {item.nome}
      </Link>
    </li>
  )
  return (
    <nav
      aria-label="Navegação principal"
      className="bg-card border-border h-barra-inferior box-content border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex h-full items-center px-2">
        {itens.slice(0, metade).map(link)}
        <li className="flex flex-1 justify-center">
          <Link
            href={hrefCriar}
            aria-label="Novo lançamento"
            className="bg-primary text-primary-foreground rounded-pilula inline-flex size-12 items-center justify-center"
          >
            <Plus className="size-6" aria-hidden="true" />
          </Link>
        </li>
        {itens.slice(metade).map(link)}
      </ul>
    </nav>
  )
}

export function TopBarProvisoria({ titulo }: { titulo: string }) {
  return (
    <header className="bg-background border-border flex min-h-14 items-center border-b px-5">
      <h1 className="text-titulo-3 truncate">{titulo}</h1>
    </header>
  )
}
