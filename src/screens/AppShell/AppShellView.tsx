'use client'

import type { ReactNode } from 'react'
import { MonthNavigator } from '@/components/molecules/month-navigator'
import { OfflineBanner } from '@/components/molecules/offline-banner'
import { BottomNav } from '@/components/organisms/bottom-nav'
import { CategoriaDialog } from '@/components/organisms/categoria-dialog'
import { CreateSheet } from '@/components/organisms/create-sheet'
import { Sidebar } from '@/components/organisms/sidebar'
import { TopBar } from '@/components/organisms/top-bar'
import { AppShellTemplate } from '@/components/templates/app-shell-template'
import {
  escondeBottomNav,
  GRUPOS_SIDEBAR,
  ITENS_BOTTOM_NAV,
  ITENS_CRIAR,
  itemAtivo,
  ROTAS_COM_MES,
  topoDaRota,
  type ItemNavegacao,
} from '@/constants/navegacao'
import { ROTAS } from '@/constants/rotas'
import { comPeriodo } from '@/lib/periodo'
import { useAppShellContext } from './AppShellContext'

const ID_SIDEBAR = 'sidebar'
const ITENS_SIDEBAR = GRUPOS_SIDEBAR.flatMap((grupo) => grupo.itens)

// Liga o Context aos organismos de navegação, nos slots do AppShellTemplate:
// Sidebar (≥ 768px), TopBar + BottomNav + CreateSheet (< 768px).
export function AppShellView({ children }: { children: ReactNode }) {
  const {
    caminho,
    recolhida,
    aberta,
    expandida,
    alternarSidebar,
    fecharSidebar,
    periodo,
    periodoNaUrl,
    irParaMes,
    criarAberto,
    setCriarAberto,
    sair,
    saindo,
    usuario,
    fotoUrl,
    novaCategoria,
    online,
  } = useAppShellContext()

  // Dashboard e Lançamentos mantêm o mês da URL ao trocar de aba (DS: BottomNav)
  const comMes = (href: string) =>
    periodoNaUrl && ROTAS_COM_MES.includes(href) ? `${href}?${comPeriodo('', periodo)}` : href
  const decorar = (itens: ItemNavegacao[]) => itens.map((item) => ({ ...item, href: comMes(item.href) }))
  const ativoEm = (itens: ItemNavegacao[]) => {
    const ativo = itemAtivo(itens, caminho)
    return ativo && comMes(ativo)
  }
  const topo = topoDaRota(caminho)

  return (
    <AppShellTemplate
      idSidebar={ID_SIDEBAR}
      recolhida={recolhida}
      aberta={aberta}
      onFecharSidebar={fecharSidebar}
      aviso={!online && <OfflineBanner />}
      header={
        !topo.semTopBar && (
          <TopBar
            titulo={topo.titulo}
            voltar={topo.voltar}
            hrefPerfil={ROTAS.perfil}
            usuario={topo.semAvatar ? undefined : usuario && { nome: usuario.nome, fotoUrl }}
            mes={
              topo.mostrarMes && (
                <MonthNavigator variante="compacto" mes={periodo.mes} ano={periodo.ano} onChange={irParaMes} />
              )
            }
          />
        )
      }
      sidebar={
        <Sidebar
          grupos={GRUPOS_SIDEBAR.map((grupo) => ({ ...grupo, itens: decorar(grupo.itens) }))}
          ativo={ativoEm(ITENS_SIDEBAR)}
          expandida={expandida}
          onAlternar={alternarSidebar}
          onNavegar={fecharSidebar}
          onSair={sair}
          saindo={saindo}
          hrefInicio={comMes(ROTAS.dashboard)}
          hrefNovo={ROTAS.novoLancamento}
          idSidebar={ID_SIDEBAR}
          prenderFoco={aberta}
        />
      }
      bottomNav={
        escondeBottomNav(caminho) ? undefined : (
          <>
            <BottomNav
              itens={decorar(ITENS_BOTTOM_NAV)}
              ativo={ativoEm(ITENS_BOTTOM_NAV)}
              criarAberto={criarAberto}
              onCriar={() => setCriarAberto(!criarAberto)}
            />
            <CreateSheet
              aberto={criarAberto}
              onAbertoChange={setCriarAberto}
              itens={ITENS_CRIAR.map((item) =>
                item.acao === 'nova-categoria' ? { ...item, onSelect: novaCategoria.abrir } : item,
              )}
            />
            <CategoriaDialog
              aberto={novaCategoria.aberto}
              onAbertoChange={novaCategoria.setAberto}
              onSalvar={novaCategoria.salvar}
              salvando={novaCategoria.salvando}
              erroNome={novaCategoria.erroNome}
            />
          </>
        )
      }
    >
      {children}
    </AppShellTemplate>
  )
}
