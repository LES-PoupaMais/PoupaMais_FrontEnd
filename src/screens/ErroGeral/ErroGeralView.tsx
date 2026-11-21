'use client'

import { ErrorState } from '@/components/molecules/error-state'
import { PublicTemplate } from '@/components/templates/public-template'
import { ROTAS } from '@/constants/rotas'

// Erro inesperado ao montar uma página (error.tsx do Next). Nunca mostra a mensagem do erro (DS: nada cru).
// - `area="logada"`: dentro da casca (app/(app)/error.tsx), como na prancheta erro-geral-computador: card de erro no conteúdo.
// - `area="publica"`: página inteira com o topo do site (app/error.tsx).
export type ErroGeralViewProps = { area: 'logada' | 'publica'; onTentarDeNovo: () => void }

export function ErroGeralView({ area, onTentarDeNovo }: ErroGeralViewProps) {
  const logada = area === 'logada'
  const estado = (
    <ErrorState
      titulo="Não foi possível carregar esta página."
      onTentarDeNovo={onTentarDeNovo}
      acaoSecundaria={{ rotulo: 'Voltar ao início', href: logada ? ROTAS.dashboard : ROTAS.inicio }}
      className="w-full px-8 py-18"
    />
  )
  if (logada) return <div className="flex flex-col">{estado}</div>
  return (
    <PublicTemplate variante="site" acoes={null} rodape={null}>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 items-center px-5 py-12">{estado}</div>
    </PublicTemplate>
  )
}
