'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { ItemNavegacao } from '@/constants/navegacao'

// Barra inferior do celular, abaixo de 768px (DS: BottomNav): 4 abas e o + central elevado, que abre a CreateSheet.
// Puro: a rota ativa e o estado da folha chegam por props.
export type BottomNavProps = {
  /** 4 abas; o + entra no meio (entre a 2ª e a 3ª) */
  itens: ItemNavegacao[]
  /** href do item ativo (`constants/navegacao.itemAtivo`): nas subtelas de Lançamentos, Lançamentos */
  ativo?: string
  /** A folha Criar está aberta: o + gira para × */
  criarAberto: boolean
  /** Toque no + */
  onCriar: () => void
}

export function BottomNav({ itens, ativo, criarAberto, onCriar }: BottomNavProps) {
  const metade = Math.ceil(itens.length / 2)

  const aba = (item: ItemNavegacao) => (
    <li key={item.href} className="flex min-w-0">
      <Link
        href={item.href}
        aria-current={item.href === ativo ? 'page' : undefined}
        className="group/aba rounded-campo text-muted-foreground hover:text-foreground aria-[current=page]:text-primary h-barra-inferior flex w-full flex-col items-center justify-center gap-0.5 pt-1 pb-2"
      >
        <span className="rounded-pilula group-aria-[current=page]/aba:bg-accent grid h-7.5 w-14 place-items-center transition-colors">
          <item.icone className="size-5 group-aria-[current=page]/aba:stroke-[2.25]" aria-hidden="true" />
        </span>
        <span className="text-mini whitespace-nowrap">{item.nome}</span>
      </Link>
    </li>
  )

  return (
    <nav
      aria-label="Navegação principal"
      data-slot="bottom-nav"
      className="bg-card border-border border-t px-1 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))_72px_repeat(2,minmax(0,1fr))] items-end">
        {itens.slice(0, metade).map(aba)}
        <li className="h-barra-inferior flex items-start justify-center">
          <button
            type="button"
            aria-label={criarAberto ? 'Fechar Criar' : 'Criar'}
            aria-haspopup="dialog"
            aria-expanded={criarAberto}
            className="group/criar bg-primary text-primary-foreground hover:bg-primaria-hover shadow-flutuante border-background -mt-5 box-content grid size-14 place-items-center rounded-full border-4"
            onClick={onCriar}
          >
            <Plus
              className="size-6 transition-transform duration-200 group-aria-expanded/criar:rotate-45"
              aria-hidden="true"
            />
          </button>
        </li>
        {itens.slice(metade).map(aba)}
      </ul>
    </nav>
  )
}
