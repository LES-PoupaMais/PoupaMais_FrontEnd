'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { logoutAction } from '@/actions/auth.actions'
import { MIDIA, useMediaQuery } from '@/hooks/use-media-query'
import { fotoDoUsuario, useUsuario } from '@/hooks/use-usuario'
import { comPeriodo, lerPeriodo } from '@/lib/periodo'
import { gravarSidebarRecolhida } from '@/lib/sidebar-cookie'
import type { MesAno, Usuario } from '@/types/api'
import { useNovaCategoria } from './useNovaCategoria'

// Estado da casca da área logada: sidebar (recolhida no computador, aberta por cima no tablet), rota ativa, mês da URL
// (para a TopBar do celular), folha Criar, usuário e "Sair".
type AppShellContextValue = {
  /** Caminho atual (para marcar o item ativo da navegação) */
  caminho: string
  /** Preferência do computador, salva no cookie `sidebar` */
  recolhida: boolean
  /** Tablet: sidebar aberta por cima do conteúdo */
  aberta: boolean
  /** Sidebar mostrando os nomes agora (para o `aria-expanded` do botão de alternar e os tooltips do trilho) */
  expandida: boolean
  /** Botão `panel-left`: no computador recolhe/expande (e grava o cookie); no tablet abre/fecha por cima */
  alternarSidebar: () => void
  /** Véu, Esc ou escolha de um item */
  fecharSidebar: () => void
  /** Mês exibido (`?mes=&ano=`; sem parâmetro, o mês atual) */
  periodo: MesAno
  /** A URL tem `mes` e `ano`: os links de Dashboard e Lançamentos levam o mesmo mês */
  periodoNaUrl: boolean
  /** Troca o mês na URL (MonthNavigator da TopBar) */
  irParaMes: (periodo: MesAno) => void
  /** Folha Criar (celular) */
  criarAberto: boolean
  setCriarAberto: (aberto: boolean) => void
  /** "Sair": apaga o cookie da sessão no servidor e vai para /login */
  sair: () => void
  saindo: boolean
  usuario: Usuario | undefined
  /** URL da foto do avatar, ou null (inicial do nome) */
  fotoUrl: string | null
  /** "Nova categoria" da folha Criar: diálogo de categoria aberto ali mesmo */
  novaCategoria: ReturnType<typeof useNovaCategoria>
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ sidebarRecolhida, children }: { sidebarRecolhida: boolean; children: ReactNode }) {
  const caminho = usePathname()
  const router = useRouter()
  const parametros = useSearchParams()
  const computador = useMediaQuery(MIDIA.computador)
  const [recolhida, setRecolhida] = useState(sidebarRecolhida)
  const [aberta, setAberta] = useState(false)
  const [criarAberto, setCriarAberto] = useState(false)
  const [saindo, iniciarSaida] = useTransition()
  const { data: usuario, dataUpdatedAt } = useUsuario()
  const novaCategoria = useNovaCategoria()

  function alternarSidebar() {
    if (computador) {
      const nova = !recolhida
      setRecolhida(nova)
      gravarSidebarRecolhida(nova)
    } else {
      setAberta((atual) => !atual)
    }
  }

  // replace (não push): trocar de mês não enche o histórico do Voltar; scroll false mantém a posição
  const irParaMes = (novo: MesAno) =>
    router.replace(`${caminho}?${comPeriodo(parametros.toString(), novo)}`, { scroll: false })

  // O redirect da action leva para /login; o cookie httpOnly só pode ser apagado no servidor
  const sair = () => iniciarSaida(() => logoutAction())

  const valor: AppShellContextValue = {
    caminho,
    recolhida,
    aberta,
    expandida: computador ? !recolhida : aberta,
    alternarSidebar,
    fecharSidebar: () => setAberta(false),
    periodo: lerPeriodo(parametros),
    periodoNaUrl: parametros.has('mes') && parametros.has('ano'),
    irParaMes,
    criarAberto,
    setCriarAberto,
    sair,
    saindo,
    usuario,
    fotoUrl: fotoDoUsuario(usuario, dataUpdatedAt),
    novaCategoria,
  }

  return <AppShellContext.Provider value={valor}>{children}</AppShellContext.Provider>
}

export function useAppShellContext() {
  const contexto = useContext(AppShellContext)
  if (!contexto) throw new Error('useAppShellContext precisa estar dentro de <AppShellProvider>')
  return contexto
}
