'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import { Avatar as AvatarPrimitive } from 'radix-ui'
import { UserIcon } from 'lucide-react'

function Avatar({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'default' | 'sm' | 'lg'
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        'group/avatar after:border-border relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full rounded-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs',
        className,
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        className,
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'group/avatar-group *:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2',
        className,
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'bg-muted text-muted-foreground ring-background relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  )
}

// PoupaMais: avatar do usuário (DS components/Avatar). Mostra a foto (RN015) e, sem foto ou enquanto ela carrega,
// a primeira letra do nome em maiúscula sobre `primaria-fundo` (cor única, sem significado). Sem nome: neutro, com o ícone `user`.
function inicialDoNome(nome: string): string {
  return nome.trim().charAt(0).toLocaleUpperCase('pt-BR')
}

// PoupaMais: tamanhos do DS: 32 (TopBar), 40 (listas) e 96 (Perfil).
const TAMANHOS_AVATAR = {
  32: 'size-8 text-[13px]',
  40: 'size-10 text-base',
  96: 'size-24 text-[38px]',
} as const

type AvatarUsuarioProps = {
  nome: string
  fotoUrl?: string | null
  tamanho?: keyof typeof TAMANHOS_AVATAR
  /** Dentro de um link ou botão que já tem nome ("Seu perfil"): o avatar fica escondido do leitor de tela. */
  decorativo?: boolean
  className?: string
}

function AvatarUsuario({ nome, fotoUrl, tamanho = 40, decorativo = false, className }: AvatarUsuarioProps) {
  const inicial = inicialDoNome(nome)
  return (
    <Avatar className={cn(TAMANHOS_AVATAR[tamanho], 'after:hidden', className)} aria-hidden={decorativo || undefined}>
      {fotoUrl && <AvatarImage src={fotoUrl} alt={decorativo ? '' : `Foto de ${nome}`} />}
      <AvatarFallback
        role={decorativo ? undefined : 'img'}
        aria-label={decorativo ? undefined : inicial ? `Avatar de ${nome}` : 'Avatar'}
        className={cn(
          'text-[length:inherit] leading-none font-extrabold uppercase',
          inicial ? 'bg-primaria-fundo text-primary' : 'bg-secondary text-muted-foreground',
        )}
      >
        {inicial || <UserIcon className="size-1/2" aria-hidden="true" />}
      </AvatarFallback>
    </Avatar>
  )
}

export type { AvatarUsuarioProps }
export { AvatarUsuario, inicialDoNome, Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge }
