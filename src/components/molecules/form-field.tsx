'use client'

import { CircleAlert } from 'lucide-react'
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/atoms/label'
import { cn } from '@/lib/cn'

// Campo de formulário do Design System (components/Input): rótulo visível + controle + ajuda, contador e erro.
// Liga tudo por acessibilidade: `id` no controle, ajuda/contador/erro em `aria-describedby`, `aria-invalid` e `required`.

/** Props que o FormField entrega ao controle (Input, Textarea, Select…). */
export type ControleDoCampo = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  required?: boolean
  disabled?: boolean
}

export type FormFieldProps = {
  /** Rótulo curto, sem dois-pontos (nunca substituído pelo placeholder) */
  label: ReactNode
  /** id do controle; sem ele, um id é gerado */
  id?: string
  /** Texto de ajuda abaixo do campo (some quando há erro) */
  help?: ReactNode
  /** Mensagem de erro (já traduzida); liga `aria-invalid` no controle */
  error?: string | null
  /** Asterisco visual (aria-hidden) e `required` no controle */
  required?: boolean
  disabled?: boolean
  /** Contador de caracteres ("0/100"); fica em destaque a partir de 90% do limite */
  contador?: { atual: number; maximo: number }
  className?: string
  /** O controle. Elemento: recebe as props por clone. Função: recebe as props para espalhar. */
  children: ReactElement<Record<string, unknown>> | ((controle: ControleDoCampo) => ReactNode)
}

/** Mensagem de erro do Design System: ícone `circle-alert` + texto em `erro` (nunca só cor). */
export function MensagemErro({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <p id={id} className={cn('text-legenda text-destructive flex items-start gap-1', className)}>
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

/** Asterisco de campo obrigatório (só visual; o `required` do controle é que avisa o leitor de tela). */
export function MarcaObrigatorio() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  )
}

export function juntarIds(...ids: Array<string | false | null | undefined>): string | undefined {
  const lista = ids.filter(Boolean).join(' ')
  return lista || undefined
}

export function FormField({
  label,
  id,
  help,
  error,
  required = false,
  disabled = false,
  contador,
  className,
  children,
}: FormFieldProps) {
  const gerado = useId()
  const controleId = id ?? `campo-${gerado}`
  const ajudaId = `${controleId}-ajuda`
  const erroId = `${controleId}-erro`
  const contadorId = `${controleId}-contador`
  const temErro = Boolean(error)
  const mostrarAjuda = !temErro && Boolean(help)
  const pertoDoLimite = contador ? contador.atual >= contador.maximo * 0.9 : false

  const controle: ControleDoCampo = {
    id: controleId,
    'aria-describedby': juntarIds(temErro && erroId, mostrarAjuda && ajudaId, contador && contadorId),
    'aria-invalid': temErro ? true : undefined,
    required: required || undefined,
    disabled: disabled || undefined,
  }

  let conteudo: ReactNode
  if (typeof children === 'function') {
    conteudo = children(controle)
  } else if (isValidElement(children)) {
    const proprias = children.props
    conteudo = cloneElement(children, {
      ...controle,
      'aria-describedby': juntarIds(controle['aria-describedby'], proprias['aria-describedby'] as string | undefined),
    })
  }

  return (
    <div data-slot="form-field" data-invalid={temErro || undefined} className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={controleId} className={cn(disabled && 'text-muted-foreground')}>
        <span>
          {label}
          {required && <MarcaObrigatorio />}
        </span>
      </Label>
      {conteudo}
      {(temErro || mostrarAjuda || contador) && (
        <div className="flex items-start justify-between gap-3">
          {temErro && <MensagemErro id={erroId}>{error}</MensagemErro>}
          {mostrarAjuda && (
            <p id={ajudaId} className="text-legenda text-muted-foreground">
              {help}
            </p>
          )}
          {contador && (
            <span
              id={contadorId}
              className={cn(
                'text-legenda text-muted-foreground ml-auto whitespace-nowrap tabular-nums',
                pertoDoLimite && 'text-destructive font-bold',
              )}
            >
              {contador.atual}/{contador.maximo}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
