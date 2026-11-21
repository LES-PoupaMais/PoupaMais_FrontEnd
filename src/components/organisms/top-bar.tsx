import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { AvatarUsuario } from '@/components/atoms/avatar'
import { ID_ACAO_DA_TOPBAR } from '@/constants/navegacao'

// Topo do celular, abaixo de 768px (DS: TopBar): título, MonthNavigator compacto (só Início e Lançamentos) e avatar.
// Telas internas (Lixeira, Novo, Editar, Visualizar, Importar) usam o "‹" com o destino, sem mês e sem avatar.
// Sem sino de avisos. Puro: o mês chega pronto no slot `mes` (a tela decide se mostra).
export type TopBarProps = {
  /** Título curto ("Início", "Lançamentos"…), trunca com reticências */
  titulo: string
  /** MonthNavigator compacto (Início e Lançamentos) */
  mes?: ReactNode
  /** Tela interna: "‹" para o destino; esconde mês e avatar */
  voltar?: { href: string; destino: string }
  /** Usuário logado (avatar). Sem ele, o avatar não aparece ainda. */
  usuario?: { nome: string; fotoUrl?: string | null }
  /** Destino do avatar (o mesmo da aba Perfil) */
  hrefPerfil: string
}

export function TopBar({ titulo, mes, voltar, usuario, hrefPerfil }: TopBarProps) {
  return (
    <header
      data-slot="top-bar"
      data-voltar={Boolean(voltar)}
      className="bg-background border-border flex min-h-15 items-center gap-1 border-b py-2 pr-2 pl-4 data-[voltar=true]:pl-1"
    >
      {voltar && (
        <Link
          href={voltar.href}
          aria-label={`Voltar para ${voltar.destino}`}
          className="rounded-pilula text-foreground hover:bg-secondary inline-grid size-11 shrink-0 place-items-center"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
      )}
      <h1 className="text-titulo-3 min-w-0 flex-1 truncate">{titulo}</h1>
      {/* Telas internas: a tela pode pôr uma ação aqui (portal), ex.: "Limpar" do Novo lançamento */}
      {voltar && <div id={ID_ACAO_DA_TOPBAR} className="flex shrink-0 items-center empty:hidden" />}
      {!voltar && mes}
      {!voltar && usuario && (
        <Link
          href={hrefPerfil}
          aria-label="Seu perfil"
          className="group/avatar-botao inline-grid size-11 shrink-0 place-items-center rounded-full"
        >
          <AvatarUsuario
            nome={usuario.nome}
            fotoUrl={usuario.fotoUrl}
            className="group-hover/avatar-botao:ring-secondary ring-0 group-hover/avatar-botao:ring-3"
          />
        </Link>
      )}
    </header>
  )
}
