'use client'

import { Mail } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'

// Campo de e-mail das telas de acesso (pranchetas login, cadastro, esqueci): FormField + Input com o ícone Mail no início.
// Repassa o `ref` (React Hook Form `register`).
export type EmailFieldProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  label?: ReactNode
  error?: string | null
  /** Classe do bloco (rótulo + campo + mensagens) */
  className?: string
}

export function EmailField({ label = 'E-mail', error, id, required, disabled, className, ...props }: EmailFieldProps) {
  return (
    <FormField label={label} id={id} error={error} required={required} disabled={disabled} className={className}>
      {(controle) => (
        <div className="relative flex items-center">
          <Mail
            className="text-muted-foreground pointer-events-none absolute left-3 size-5"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <Input
            {...controle}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@email.com"
            {...props}
            className="pl-10"
          />
        </div>
      )}
    </FormField>
  )
}
