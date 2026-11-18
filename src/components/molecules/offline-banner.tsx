import { WifiOff } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/cn'

// OfflineBanner do Design System: faixa que avisa que a internet caiu (dá para ver, não dá para salvar).
// Atenção sobre atenção-fundo, ícone WifiOff, `role="status"` + `aria-live="polite"`.
// Quem decide quando mostrar é a tela (navigator.onLine); os botões que gravam ficam com `aria-disabled` e
// `aria-describedby` apontando para o `OfflineMotivo`.

const TEXTO = 'Sem internet agora. Você pode continuar vendo, mas não dá para salvar.'
const MOTIVO = 'Sem internet. O que você preencheu fica aqui até a conexão voltar.'

type OfflineBannerProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** `fixa` = presa no topo da tela, abaixo do cabeçalho (padrão); `canto` = solta, com cantos arredondados */
  variante?: 'fixa' | 'canto'
}

function OfflineBanner({ variante = 'fixa', className, ...props }: OfflineBannerProps) {
  return (
    <div
      data-slot="offline-banner"
      role="status"
      aria-live="polite"
      className={cn(
        'bg-atencao-fundo text-legenda text-atencao flex min-h-11 items-center gap-3 px-4 py-3 font-bold',
        variante === 'fixa' ? 'sticky top-0 z-10' : 'rounded-campo',
        className,
      )}
      {...props}
    >
      <WifiOff className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <p className="flex-1">{TEXTO}</p>
    </div>
  )
}

type OfflineMotivoProps = Omit<React.ComponentProps<'p'>, 'children'> & {
  /** Referenciado pelo `aria-describedby` do botão desabilitado */
  id: string
}

/** Motivo escrito abaixo do botão que grava enquanto não há internet */
function OfflineMotivo({ className, ...props }: OfflineMotivoProps) {
  return (
    <p
      data-slot="offline-motivo"
      className={cn('text-legenda text-muted-foreground flex items-center justify-center gap-2 text-center', className)}
      {...props}
    >
      <WifiOff className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {MOTIVO}
    </p>
  )
}

export { OfflineBanner, OfflineMotivo }
export type { OfflineBannerProps, OfflineMotivoProps }
