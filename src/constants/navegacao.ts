import { House, LayoutDashboard, List, Tags, Trash2, User, type LucideIcon } from 'lucide-react'
import { ROTAS } from './rotas'

// Destinos da navegação (DS: Navegação e layout, "Destinos atuais"). A Sidebar e a BottomNav recebem isto por props.
export type ItemNavegacao = { nome: string; href: string; icone: LucideIcon }
export type GrupoNavegacao = { titulo: string; itens: ItemNavegacao[] }

/** Sidebar (≥ 768px). "Sair" fica no grupo Conta, mas é ação (Server Action), não link: a tela acrescenta. */
export const GRUPOS_SIDEBAR: GrupoNavegacao[] = [
  {
    titulo: 'Dia a dia',
    itens: [
      { nome: 'Dashboard', href: ROTAS.dashboard, icone: LayoutDashboard },
      { nome: 'Lançamentos', href: ROTAS.lancamentos, icone: List },
      { nome: 'Categorias', href: ROTAS.categorias, icone: Tags },
      { nome: 'Lixeira', href: ROTAS.lixeira, icone: Trash2 },
    ],
  },
  { titulo: 'Conta', itens: [{ nome: 'Perfil', href: ROTAS.perfil, icone: User }] },
]

/** BottomNav (< 768px): 4 abas + o botão Criar no meio (entre o 2º e o 3º item) */
export const ITENS_BOTTOM_NAV: ItemNavegacao[] = [
  { nome: 'Início', href: ROTAS.dashboard, icone: House },
  { nome: 'Lançamentos', href: ROTAS.lancamentos, icone: List },
  { nome: 'Categorias', href: ROTAS.categorias, icone: Tags },
  { nome: 'Perfil', href: ROTAS.perfil, icone: User },
]

/** Título curto da TopBar (celular), por rota */
export const TITULOS_TOPBAR: Record<string, string> = {
  [ROTAS.dashboard]: 'Início',
  [ROTAS.lancamentos]: 'Lançamentos',
  [ROTAS.lixeira]: 'Lixeira',
  [ROTAS.categorias]: 'Categorias',
  [ROTAS.perfil]: 'Perfil',
}

/**
 * Item ativo para uma rota: o mais específico que casa com o caminho.
 * Lixeira, Novo, Editar, Visualizar e Importar são subtelas de Lançamentos: na BottomNav, o ativo é Lançamentos.
 */
export function itemAtivo(itens: ItemNavegacao[], caminho: string): string | undefined {
  return itens
    .filter(({ href }) => caminho === href || caminho.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}
