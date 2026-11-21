import { FileUp, House, LayoutDashboard, List, Plus, Tag, Tags, Trash2, User, type LucideIcon } from 'lucide-react'
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

/** Itens da folha "Criar" (CreateSheet), aberta pelo + da BottomNav. Aceita de 3 a 8 itens (DS). */
export type ItemCriar = {
  titulo: string
  subtitulo: string
  icone: LucideIcon
  /** Leva a outra tela… */
  href?: string
  /** …ou faz uma ação ali mesmo, sem sair da tela (a AppShellView liga ao `onSelect` da folha) */
  acao?: 'nova-categoria'
}

export const ITENS_CRIAR: ItemCriar[] = [
  {
    titulo: 'Novo lançamento',
    subtitulo: 'Registre uma receita ou despesa do mês.',
    icone: Plus,
    href: ROTAS.novoLancamento,
  },
  { titulo: 'Importar CSV', subtitulo: 'Envie vários lançamentos de uma vez.', icone: FileUp, href: ROTAS.importar },
  // O DS abre o diálogo de categoria aqui mesmo (categoria-dialog), sem trocar de tela
  {
    titulo: 'Nova categoria',
    subtitulo: 'Organize seus lançamentos por assunto.',
    icone: Tag,
    acao: 'nova-categoria',
  },
]

/** id do espaço de ação à direita da TopBar nas telas internas (ex.: "Limpar" do Novo lançamento, que a tela põe ali) */
export const ID_ACAO_DA_TOPBAR = 'top-bar-acao'

/** O que a TopBar (celular) mostra em cada rota (DS: TopBar) */
export type TopoDaRota = {
  /** Título curto, uma palavra quando possível */
  titulo: string
  /** MonthNavigator compacto: só em Início e Lançamentos */
  mostrarMes: boolean
  /** Telas internas: "‹" com o destino, sem mês e sem avatar */
  voltar?: { href: string; destino: string }
  /** A tela desenha o próprio topo no celular (Visualizar: "‹ Lançamentos" ou "‹ Lixeira", conforme o status) */
  semTopBar?: boolean
  /** Sem o avatar (a própria tela do Perfil) */
  semAvatar?: boolean
}

const VOLTAR_LANCAMENTOS = { href: ROTAS.lancamentos, destino: 'Lançamentos' }

// Da mais específica para a mais geral: a primeira que casa decide
const TOPOS: [RegExp, TopoDaRota][] = [
  [/^\/dashboard$/, { titulo: 'Início', mostrarMes: true }],
  [/^\/lancamentos$/, { titulo: 'Lançamentos', mostrarMes: true }],
  [/^\/lancamentos\/lixeira$/, { titulo: 'Lixeira', mostrarMes: false, voltar: VOLTAR_LANCAMENTOS }],
  [/^\/lancamentos\/novo$/, { titulo: 'Novo lançamento', mostrarMes: false, voltar: VOLTAR_LANCAMENTOS }],
  [/^\/lancamentos\/importar$/, { titulo: 'Importar CSV', mostrarMes: false, voltar: VOLTAR_LANCAMENTOS }],
  [/^\/lancamentos\/\d+\/editar$/, { titulo: 'Editar lançamento', mostrarMes: false, voltar: VOLTAR_LANCAMENTOS }],
  [/^\/lancamentos\/\d+$/, { titulo: 'Lançamento', mostrarMes: false, voltar: VOLTAR_LANCAMENTOS, semTopBar: true }],
  [/^\/categorias$/, { titulo: 'Categorias', mostrarMes: false }],
  [/^\/perfil$/, { titulo: 'Perfil', mostrarMes: false, semAvatar: true }],
]

/** Título, mês e Voltar da TopBar para um caminho. Rota desconhecida: só o nome do app. */
export function topoDaRota(caminho: string): TopoDaRota {
  return TOPOS.find(([padrao]) => padrao.test(caminho))?.[1] ?? { titulo: 'PoupaMais', mostrarMes: false }
}

/** Telas de formulário escondem a BottomNav (o rodapé fixo com "Salvar" ou "Importar lançamentos" ocupa o lugar) */
export function escondeBottomNav(caminho: string): boolean {
  return /^\/lancamentos\/(novo|importar|\d+\/editar)$/.test(caminho)
}

/** Destinos que usam o mês da URL: ao trocar de aba, o link leva o mesmo `?mes=&ano=` (DS: BottomNav) */
export const ROTAS_COM_MES: readonly string[] = [ROTAS.dashboard, ROTAS.lancamentos]

/**
 * Item ativo para uma rota: o mais específico que casa com o caminho.
 * Lixeira, Novo, Editar, Visualizar e Importar são subtelas de Lançamentos: na BottomNav, o ativo é Lançamentos.
 */
export function itemAtivo(itens: ItemNavegacao[], caminho: string): string | undefined {
  return itens
    .filter(({ href }) => caminho === href || caminho.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}
