'use client'

import { cva } from 'class-variance-authority'
import { CircleAlert, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/cn'

// ActionBanner do Design System: faixa de aviso dentro da página que fica até a pessoa agir, com 1 ou 2 ações em texto
// sublinhado na cor da faixa (nunca botão preenchido). Ícone sempre junto da cor.
// Variantes do DS: info, atenção e erro (confirmação de ação concluída é toast). Papéis: info e atenção → `role="status"`;
// erro → `role="alert"`.

type Variante = 'info' | 'atencao' | 'erro'

const actionBannerVariants = cva('flex items-start gap-3 rounded-campo py-3 pr-2 pl-4', {
  variants: {
    variante: {
      info: 'bg-accent text-foreground',
      atencao: 'bg-atencao-fundo text-atencao',
      erro: 'bg-erro-fundo text-destructive',
    },
  },
  defaultVariants: { variante: 'info' },
})

const ICONE: Record<Variante, { Icone: LucideIcon; cor: string }> = {
  info: { Icone: Info, cor: 'text-primary' },
  atencao: { Icone: TriangleAlert, cor: 'text-atencao' },
  erro: { Icone: CircleAlert, cor: 'text-destructive' },
}

type AcaoDoAviso = { rotulo: string; onClick: () => void }

type ActionBannerProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  variante?: Variante
  /** Uma frase */
  texto: string
  /** 1 ou 2 ações (a primeira em negrito; a segunda mais leve) */
  acoes?: readonly [AcaoDoAviso] | readonly [AcaoDoAviso, AcaoDoAviso]
  /** Botão de fechar (DS: só para informação) */
  onFechar?: () => void
}

function ActionBanner({ variante = 'info', texto, acoes, onFechar, className, ...props }: ActionBannerProps) {
  const { Icone, cor } = ICONE[variante]

  return (
    <div
      data-slot="action-banner"
      data-variante={variante}
      role={variante === 'erro' ? 'alert' : 'status'}
      className={cn(actionBannerVariants({ variante }), className)}
      {...props}
    >
      <Icone className={cn('mt-3 size-5 shrink-0', cor)} strokeWidth={1.75} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3">
        <p className="text-corpo flex-[1_1_200px] py-[11px] font-semibold">{texto}</p>
        {acoes && acoes.length > 0 && (
          <div className="flex flex-wrap gap-x-1">
            {acoes.map((acao, indice) => (
              <button
                key={acao.rotulo}
                type="button"
                onClick={acao.onClick}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-sm px-2 text-[15px] underline underline-offset-3 hover:decoration-2',
                  indice === 0 ? 'font-extrabold' : 'font-semibold',
                )}
              >
                {acao.rotulo}
              </button>
            ))}
          </div>
        )}
      </div>
      {onFechar && (
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={onFechar}
          className="rounded-pilula hover:bg-secondary inline-grid size-11 shrink-0 place-items-center"
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export { ActionBanner, actionBannerVariants }
export type { AcaoDoAviso, ActionBannerProps }
