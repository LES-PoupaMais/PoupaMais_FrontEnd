'use client'

import { CircleAlert, Compass, House, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import type * as React from 'react'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/cn'

// ErrorState do Design System: ocupa a área de conteúdo quando algo não carregou ou a página não existe, sempre com uma saída.
// - carregar: ícone CircleAlert em erro, `role="alert"`, botão contornado "Tentar de novo" (vira "Tentando…" com spinner);
// - nao-encontrado: ícone Compass neutro, "404", título como h1, botão primário "Voltar ao início".
// A mensagem chega traduzida (lib/http), nunca a da API crua.

type ErrorStateProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  tipo?: 'carregar' | 'nao-encontrado'
  titulo?: string
  texto?: string
  /** Erro ao carregar: ação do botão "Tentar de novo" */
  onTentarDeNovo?: () => void
  /** Enquanto tenta de novo: botão desabilitado, spinner e "Tentando…" */
  tentando?: boolean
  /** 404: destino do botão (`/dashboard` logado, `/` deslogado) */
  href?: string
  rotuloAcao?: string
  /** Sem a superfície de card (quando já está dentro de um card) */
  semCartao?: boolean
}

const PADRAO = {
  carregar: {
    titulo: 'Não foi possível carregar',
    texto: 'Confira sua conexão e tente de novo. Seus dados continuam guardados.',
    rotuloAcao: 'Tentar de novo',
  },
  'nao-encontrado': {
    titulo: 'Página não encontrada',
    texto: 'O endereço pode ter mudado ou não existe mais.',
    rotuloAcao: 'Voltar ao início',
  },
} as const

function ErrorState({
  tipo = 'carregar',
  titulo,
  texto,
  onTentarDeNovo,
  tentando = false,
  href = '/',
  rotuloAcao,
  semCartao = false,
  className,
  ...props
}: ErrorStateProps) {
  const padrao = PADRAO[tipo]
  const naoEncontrado = tipo === 'nao-encontrado'
  const Titulo = naoEncontrado ? 'h1' : 'h2'
  const Icone = naoEncontrado ? Compass : CircleAlert

  return (
    <section
      data-slot="error-state"
      data-tipo={tipo}
      role={naoEncontrado ? undefined : 'alert'}
      className={cn(
        'flex flex-col items-center gap-3 px-5 py-8 text-center',
        !semCartao && 'rounded-card border-border bg-card text-card-foreground shadow-card border',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'rounded-card grid size-14 place-items-center',
          naoEncontrado ? 'bg-secondary text-muted-foreground' : 'bg-erro-fundo text-destructive',
        )}
      >
        <Icone className="size-6" strokeWidth={2} />
      </span>
      {naoEncontrado && (
        <p aria-hidden="true" className="text-display text-muted-foreground tabular-nums">
          404
        </p>
      )}
      <Titulo className="text-titulo-2">{titulo ?? padrao.titulo}</Titulo>
      <p className="text-corpo text-muted-foreground max-w-[40ch]">{texto ?? padrao.texto}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {naoEncontrado ? (
          <Button asChild size="xl">
            <Link href={href}>
              <House aria-hidden="true" />
              {rotuloAcao ?? padrao.rotuloAcao}
            </Link>
          </Button>
        ) : (
          onTentarDeNovo && (
            <Button variant="contornado" loading={tentando} onClick={onTentarDeNovo}>
              {!tentando && <RefreshCw aria-hidden="true" />}
              {tentando ? 'Tentando…' : (rotuloAcao ?? padrao.rotuloAcao)}
            </Button>
          )
        )}
      </div>
    </section>
  )
}

export { ErrorState }
export type { ErrorStateProps }
