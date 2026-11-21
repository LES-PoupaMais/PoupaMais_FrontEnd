import { cva, type VariantProps } from 'class-variance-authority'
import Image from 'next/image'
import type * as React from 'react'
import { cn } from '@/lib/cn'

// Logo do PoupaMais (DS: Logo). Arquivos em public/logos (cópia de ../Documentação/design/ds/logos).
// Troca pelo tema só com CSS (dark:), sem hook: no escuro não existe logo horizontal, então entra o cofrinho escuro
// com o nome em texto ("Mais" em text-receita). Nunca recolorir nem usar o logo claro sobre fundo escuro.
const logoVariants = cva('inline-flex shrink-0 items-center', {
  variants: {
    variante: {
      /** topo da landing, login e cadastro */
      horizontal: 'h-14 gap-3',
      /** sidebar expandida: cofrinho + nome em texto */
      sidebar: 'h-10 gap-3',
      /** sidebar recolhida (trilho), favicon, estados vazios */
      cofrinho: 'size-10',
    },
  },
  defaultVariants: { variante: 'horizontal' },
})

// Pranchetas (topos e rodapés públicos e de acesso): no claro o logo fica numa moldura branca (raio 12, 4px × 8px de
// respiro); no escuro não há moldura, mas o respiro vertical fica, então o cofrinho mede a altura menos 8px
// (44 → 36, 48 → 40, 56 → 48), como nas pranchetas.
const MOLDURA = 'bg-card rounded-xl px-2 py-1 dark:bg-transparent dark:px-0'

type LogoProps = React.ComponentProps<'span'> &
  VariantProps<typeof logoVariants> & {
    /** Moldura branca do logo no claro (topos e rodapés das pranchetas públicas e de acesso) */
    moldura?: boolean
  }

function Nome({ className }: { className?: string }) {
  return (
    <span className={cn('text-titulo-3 text-foreground', className)}>
      Poupa<span className="text-receita">Mais</span>
    </span>
  )
}

function Cofrinho({ escuro, className }: { escuro?: boolean; className?: string }) {
  return (
    <Image
      src={escuro ? '/logos/poupamais-cofrinho-escuro.jpg' : '/logos/poupamais-cofrinho.jpg'}
      alt=""
      width={512}
      height={528}
      className={cn('aspect-512/528 h-full w-auto rounded-[22%]', className)}
    />
  )
}

function Logo({ variante = 'horizontal', moldura = false, className, ...props }: LogoProps) {
  return (
    <span
      data-slot="logo"
      data-variante={variante}
      role="img"
      aria-label="PoupaMais"
      className={cn(logoVariants({ variante }), moldura && MOLDURA, className)}
      {...props}
    >
      {variante === 'horizontal' && (
        <>
          <Image
            src="/logos/poupamais-navbar.jpg"
            alt=""
            width={640}
            height={255}
            priority
            className="h-full w-auto dark:hidden"
          />
          {/* Pranchetas: cofrinho do tamanho do logo e o nome em titulo-3, com 10px entre eles (cabe no topo a 360px) */}
          <span className="hidden h-full items-center gap-2.5 dark:inline-flex">
            <Cofrinho escuro />
            <Nome />
          </span>
        </>
      )}
      {variante !== 'horizontal' && (
        <>
          <Cofrinho className="dark:hidden" />
          <Cofrinho escuro className="hidden dark:block" />
          {variante === 'sidebar' && <Nome />}
        </>
      )}
    </span>
  )
}

export { Logo, logoVariants }
export type { LogoProps }
