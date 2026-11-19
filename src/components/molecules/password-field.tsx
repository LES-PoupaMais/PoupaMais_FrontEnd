'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode, type Ref } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'

// Campo de senha do Design System (components/PasswordField): o olho mostra ou oculta só este campo.
// O botão tem nome fixo "Mostrar senha" e o estado vai em `aria-pressed`. Ao enviar o formulário, a senha volta a ficar oculta.

export type PasswordFieldProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  label: ReactNode
  help?: ReactNode
  error?: string | null
  /** `current-password` (login, senha atual) ou `new-password` (cadastro, troca) */
  autoComplete?: 'current-password' | 'new-password'
  /** Classe do bloco (rótulo + campo + mensagens) */
  className?: string
}

function juntarRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (valor: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(valor)
      else if (ref) ref.current = valor
    }
  }
}

export function PasswordField({
  label,
  help,
  error,
  id,
  required,
  disabled,
  className,
  autoComplete = 'current-password',
  ref,
  ...props
}: PasswordFieldProps) {
  const [visivel, setVisivel] = useState(false)
  const [formulario, setFormulario] = useState<HTMLFormElement | null>(null)
  const guardarFormulario = useCallback((el: HTMLInputElement | null) => setFormulario(el?.form ?? null), [])
  const refDoCampo = useMemo(() => juntarRefs(ref, guardarFormulario), [ref, guardarFormulario])

  useEffect(() => {
    if (!formulario) return
    const ocultar = () => setVisivel(false)
    formulario.addEventListener('submit', ocultar)
    return () => formulario.removeEventListener('submit', ocultar)
  }, [formulario])

  return (
    <FormField
      label={label}
      id={id}
      help={help}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
    >
      {(controle) => (
        <div className="relative flex items-center">
          <Input
            {...controle}
            {...props}
            ref={refDoCampo}
            type={visivel ? 'text' : 'password'}
            autoComplete={autoComplete}
            className="pr-12"
          />
          <Button
            variant="texto"
            size="icone"
            className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-campo absolute right-0 focus-visible:outline-offset-[-2px]"
            aria-label="Mostrar senha"
            aria-pressed={visivel}
            aria-controls={controle.id}
            disabled={disabled}
            onClick={() => setVisivel((atual) => !atual)}
          >
            {visivel ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
      )}
    </FormField>
  )
}
