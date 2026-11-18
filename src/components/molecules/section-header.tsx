import Link from 'next/link'
import type * as React from 'react'
import { cn } from '@/lib/cn'

// Título de seção do Design System (`.pm-secao`, citado no Card): rótulo pequeno em caixa alta (texto suave) e,
// opcionalmente, o link "Ver todos" em primária à direita. Escreva o título normal ("Maiores despesas"): o CSS põe em caixa alta.

type AcaoDaSecao = {
  rotulo: string
  href: string
  /** Contexto para leitor de tela quando há vários "Ver todos" na página ("Ver todas as maiores despesas") */
  'aria-label'?: string
}

type SectionHeaderProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  titulo: string
  /** id do título (para `aria-labelledby` da lista ou do card) */
  idTitulo?: string
  nivel?: 'h2' | 'h3'
  acao?: AcaoDaSecao
}

function SectionHeader({ titulo, idTitulo, nivel: Titulo = 'h2', acao, className, ...props }: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn('mb-3 flex items-center justify-between gap-3', className)}
      {...props}
    >
      <Titulo id={idTitulo} className="text-rotulo-secao text-muted-foreground uppercase">
        {titulo}
      </Titulo>
      {acao && (
        <Link
          href={acao.href}
          aria-label={acao['aria-label']}
          className="text-legenda text-primary inline-flex min-h-11 items-center font-bold hover:underline"
        >
          {acao.rotulo}
        </Link>
      )}
    </div>
  )
}

export { SectionHeader }
export type { AcaoDaSecao, SectionHeaderProps }
