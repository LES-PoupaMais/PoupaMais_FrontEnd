'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleAlert, CircleCheck, Info, Loader2Icon, TriangleAlert, X } from 'lucide-react'

// PoupaMais: Toast do Design System (ds/project/components/Toast, `.pm-toast`) sobre o sonner sem o estilo dele
// (`unstyled`): fonte do app, superfície com borda, raio do card e sombra flutuante, até 420px; ícone de 20px na cor da
// função (sucesso em receita, erro em erro com a borda vermelha, informação em primária); ação como texto azul (com o
// ícone que vier no rótulo) e botão × de 44px no fim. A caixa não vale para o toast personalizado que já desenha a
// própria (UndoToast, `toast.custom`).

const CAIXA =
  'not-has-[[data-slot=undo-toast]]:flex not-has-[[data-slot=undo-toast]]:min-h-14 not-has-[[data-slot=undo-toast]]:items-center not-has-[[data-slot=undo-toast]]:gap-3 not-has-[[data-slot=undo-toast]]:rounded-card not-has-[[data-slot=undo-toast]]:border not-has-[[data-slot=undo-toast]]:border-border not-has-[[data-slot=undo-toast]]:bg-card not-has-[[data-slot=undo-toast]]:py-2 not-has-[[data-slot=undo-toast]]:pr-2 not-has-[[data-slot=undo-toast]]:pl-4 not-has-[[data-slot=undo-toast]]:text-foreground not-has-[[data-slot=undo-toast]]:shadow-flutuante'

const Toaster = ({ style, toastOptions, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheck strokeWidth={1.75} />,
        info: <Info strokeWidth={1.75} />,
        warning: <TriangleAlert strokeWidth={1.75} />,
        error: <CircleAlert strokeWidth={1.75} />,
        loading: <Loader2Icon className="animate-spin" />,
        close: <X strokeWidth={1.75} aria-hidden="true" />,
      }}
      style={
        {
          '--width': '420px',
          fontFamily: 'var(--font-sans)',
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: 'Fechar aviso',
        ...toastOptions,
        classNames: {
          toast: `cn-toast w-(--width) max-w-[420px] ${CAIXA}`,
          error: 'not-has-[[data-slot=undo-toast]]:border-destructive [&_[data-icon]]:text-destructive',
          icon: 'flex flex-none text-primary [&_svg]:size-5',
          success: '[&_[data-icon]]:text-receita',
          content: 'min-w-0 flex-1',
          title: 'py-2 text-[15px] leading-5 font-semibold',
          description: 'text-legenda text-muted-foreground',
          actionButton:
            'text-primary hover:bg-accent focus-visible:ring-ring rounded-pilula inline-flex min-h-11 flex-none cursor-pointer items-center gap-1.5 px-3 text-[15px] font-bold outline-none focus-visible:ring-2 [&_svg]:size-4',
          closeButton:
            'text-muted-foreground hover:bg-secondary focus-visible:ring-ring rounded-pilula order-last inline-grid size-11 flex-none cursor-pointer place-items-center outline-none focus-visible:ring-2 [&_svg]:size-5',
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
