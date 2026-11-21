'use client'

import { useId, useState, type ComponentProps, type FocusEvent, type ReactNode } from 'react'
import { Input } from '@/components/atoms/input'
import { MoneyText } from '@/components/atoms/money-text'
import { FormField, juntarIds } from '@/components/molecules/form-field'
import { formatarNumeroBR, parseBRL } from '@/lib/format'

// Campo de valor em reais do Design System (components/MoneyField): prefixo "R$", teclado decimal e leitura tolerante
// ("180", "180,5", "1.234,56", "R$ 1.234,56"). Para fora sai sempre NÚMERO (ou null quando vazio); ao sair do campo, o texto
// vira o formato pt-BR com centavos. O sinal nunca é digitado: vem do `tipo` e aparece só na prévia, com seta e cor.

const ROTULO_TIPO = { RECEITA: 'Receita', DESPESA: 'Despesa' } as const

export type MoneyFieldProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type' | 'defaultValue' | 'children'
> & {
  label: ReactNode
  /** Valor em reais (número com até 2 casas) ou null quando vazio */
  value: number | null
  onChange: (valor: number | null) => void
  /** Mostra a prévia com sinal: "Despesa: vai aparecer como − R$ 1.234,56" */
  tipo?: 'RECEITA' | 'DESPESA' | null
  help?: ReactNode
  error?: string | null
  className?: string
}

const textoDoValor = (valor: number | null) => (valor === null ? '' : formatarNumeroBR(valor))

export function MoneyField({
  label,
  value,
  onChange,
  tipo,
  help,
  error,
  id,
  required,
  disabled,
  className,
  onBlur,
  placeholder = '0,00',
  ...props
}: MoneyFieldProps) {
  const [texto, setTexto] = useState(() => textoDoValor(value))
  const [ultimoValor, setUltimoValor] = useState(value)
  const previaId = `previa-${useId()}`

  // Valor trocado por fora (reset do formulário, edição carregada): o texto acompanha, sem estragar o que a pessoa digita.
  if (value !== ultimoValor) {
    setUltimoValor(value)
    if (parseBRL(texto) !== value) setTexto(textoDoValor(value))
  }

  const aoDigitar = (bruto: string) => {
    const limpo = bruto.replace(/[^\d.,]/g, '')
    const numero = parseBRL(limpo)
    setTexto(limpo)
    setUltimoValor(numero)
    onChange(numero)
  }

  const aoSair = (evento: FocusEvent<HTMLInputElement>) => {
    const numero = parseBRL(texto)
    if (numero !== null) setTexto(formatarNumeroBR(numero))
    onBlur?.(evento)
  }

  const mostrarPrevia = Boolean(tipo) && value !== null && value > 0

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
        <>
          <div className="relative flex items-center">
            <span
              className="text-corpo-forte text-muted-foreground pointer-events-none absolute left-3 tabular-nums"
              aria-hidden="true"
            >
              R$
            </span>
            <Input
              {...controle}
              {...props}
              aria-describedby={juntarIds(controle['aria-describedby'], tipo && previaId)}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={placeholder}
              value={texto}
              onChange={(e) => aoDigitar(e.target.value)}
              onBlur={aoSair}
              className="text-titulo-3 pl-11 tabular-nums"
            />
          </div>
          {tipo && (
            <p
              id={previaId}
              aria-live="polite"
              className="text-legenda text-muted-foreground flex flex-wrap items-center gap-1"
            >
              {mostrarPrevia && (
                <>
                  {ROTULO_TIPO[tipo]}: vai aparecer como{' '}
                  <MoneyText valor={value as number} tipo={tipo} className="text-legenda font-bold" />
                </>
              )}
            </p>
          )}
        </>
      )}
    </FormField>
  )
}
