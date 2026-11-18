'use client'

import { CalendarDays, X } from 'lucide-react'
import { useRef, useState, type ComponentProps, type FocusEvent, type ReactNode } from 'react'
import { Button } from '@/components/atoms/button'
import { Calendar, DATA_MAXIMA, DATA_MINIMA } from '@/components/atoms/calendar'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/atoms/drawer'
import { Input } from '@/components/atoms/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/atoms/popover'
import { FormField } from '@/components/molecules/form-field'
import { cn } from '@/lib/cn'
import { formatarData, hojeIso, lerDataDigitada } from '@/lib/data'

// Campo de data do Design System (components/DatePicker): digitação dd/mm/aaaa + calendário de três visões.
// Para fora sai sempre ISO "AAAA-MM-DD" (ou null quando vazio ou inválido). Aceita "18112026", "18/11/2026" e "18-11-2026",
// que viram "18/11/2026" ao sair do campo. Dia que não existe (31/02/2026) ou fora da faixa dá erro no próprio campo.
// `apresentacao`: "popover" (computador, 328px sob o campo) ou "folha" (celular, folha de baixo com título, alça e ×).
// Quem escolhe é a tela (o componente é puro e não lê a largura).

export const MENSAGENS_DATA = {
  invalida: 'Informe uma data válida, no formato dd/mm/aaaa.',
  faixa: (min: string, max: string) => `Informe uma data entre ${formatarData(min)} e ${formatarData(max)}.`,
} as const

export type DatePickerProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type' | 'defaultValue' | 'children' | 'min' | 'max'
> & {
  label: ReactNode
  /** Data em ISO ("2026-11-18") ou null */
  value: string | null
  /** Recebe a data em ISO, ou null quando o campo fica vazio ou com uma data que não existe */
  onChange: (iso: string | null) => void
  /** Avisa quando o texto digitado não é uma data válida (mensagem) ou volta a ser (null); útil para o setError do formulário */
  onTextoInvalido?: (mensagem: string | null) => void
  help?: ReactNode
  error?: string | null
  /** Limites em ISO (padrão 01/01/2000 a 31/12/2100) */
  min?: string
  max?: string
  /** Hoje em ISO (padrão: hoje no fuso local). Útil nos testes. */
  hoje?: string
  apresentacao?: 'popover' | 'folha'
  /** Título da folha de baixo */
  tituloFolha?: string
  className?: string
}

const textoDaData = (iso: string | null) => (iso ? formatarData(iso) : '')

export function DatePicker({
  label,
  value,
  onChange,
  onTextoInvalido,
  help,
  error,
  id,
  required,
  disabled,
  min = DATA_MINIMA,
  max = DATA_MAXIMA,
  hoje = hojeIso(),
  apresentacao = 'popover',
  tituloFolha = 'Data do lançamento',
  className,
  onBlur,
  placeholder = 'dd/mm/aaaa',
  ref,
  ...props
}: DatePickerProps) {
  const [texto, setTexto] = useState(() => textoDaData(value))
  const [ultimoValor, setUltimoValor] = useState(value)
  const [tocado, setTocado] = useState(false)
  const [aberto, setAberto] = useState(false)
  const campo = useRef<HTMLInputElement | null>(null)

  // Valor trocado por fora (reset, edição carregada): o texto acompanha.
  if (value !== ultimoValor) {
    setUltimoValor(value)
    if (lerDataDigitada(texto) !== value) setTexto(textoDaData(value))
  }

  const validar = (bruto: string): { iso: string | null; erro: string | null } => {
    if (bruto.trim() === '') return { iso: null, erro: null }
    const iso = lerDataDigitada(bruto)
    if (!iso) return { iso: null, erro: MENSAGENS_DATA.invalida }
    if (iso < min || iso > max) return { iso: null, erro: MENSAGENS_DATA.faixa(min, max) }
    return { iso, erro: null }
  }

  const { erro: erroDoTexto } = validar(texto)

  const aoDigitar = (bruto: string) => {
    const limpo = bruto.replace(/[^\d/\-. ]/g, '').slice(0, 10)
    const anterior = validar(texto).erro
    const { iso, erro } = validar(limpo)
    setTexto(limpo)
    setUltimoValor(iso)
    onChange(iso)
    if (erro !== anterior) onTextoInvalido?.(erro)
  }

  const aoSair = (evento: FocusEvent<HTMLInputElement>) => {
    setTocado(true)
    const { iso } = validar(texto)
    if (iso) setTexto(formatarData(iso))
    onBlur?.(evento)
  }

  const escolher = (iso: string) => {
    const anterior = validar(texto).erro
    setTexto(formatarData(iso))
    setUltimoValor(iso)
    onChange(iso)
    if (anterior) onTextoInvalido?.(null)
    setAberto(false)
  }

  // O erro do texto (formato/faixa) aparece ao sair do campo, nunca enquanto a pessoa digita pela primeira vez.
  const erroVisivel = (tocado && erroDoTexto) || error || null

  const devolverFoco = (evento: Event) => {
    evento.preventDefault()
    campo.current?.focus()
  }

  const calendario = (
    <Calendar selecionado={value} onSelecionar={escolher} hoje={hoje} min={min} max={max} focarAoAbrir />
  )

  const rotuloBotao = 'Abrir calendário'
  const estiloBotao = cn(
    'text-muted-foreground hover:bg-secondary hover:text-foreground absolute right-0 rounded-campo focus-visible:outline-offset-[-2px] aria-expanded:text-primary',
  )

  return (
    <FormField
      label={label}
      id={id}
      help={help}
      error={erroVisivel}
      required={required}
      disabled={disabled}
      className={className}
    >
      {(controle) => {
        const entrada = (
          <div className="relative flex items-center">
            <Input
              {...controle}
              {...props}
              ref={(el) => {
                campo.current = el
                if (typeof ref === 'function') ref(el)
                else if (ref) ref.current = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={placeholder}
              maxLength={10}
              value={texto}
              onChange={(e) => aoDigitar(e.target.value)}
              onBlur={aoSair}
              className="pr-12 tabular-nums"
            />
            {apresentacao === 'popover' ? (
              <PopoverTrigger asChild>
                <Button
                  variant="texto"
                  size="icone"
                  aria-label={rotuloBotao}
                  disabled={disabled}
                  className={estiloBotao}
                >
                  <CalendarDays aria-hidden="true" />
                </Button>
              </PopoverTrigger>
            ) : (
              <Button
                variant="texto"
                size="icone"
                aria-label={rotuloBotao}
                aria-haspopup="dialog"
                aria-expanded={aberto}
                disabled={disabled}
                className={estiloBotao}
                onClick={() => setAberto(true)}
              >
                <CalendarDays aria-hidden="true" />
              </Button>
            )}
          </div>
        )

        if (apresentacao === 'popover') {
          return (
            <Popover open={aberto} onOpenChange={setAberto}>
              <PopoverAnchor asChild>{entrada}</PopoverAnchor>
              <PopoverContent
                align="end"
                aria-label="Escolher data"
                className="w-[min(328px,calc(100vw-2rem))]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={devolverFoco}
              >
                {calendario}
              </PopoverContent>
            </Popover>
          )
        }

        return (
          <>
            {entrada}
            <Drawer open={aberto} onOpenChange={setAberto}>
              <DrawerContent onCloseAutoFocus={devolverFoco} onOpenAutoFocus={(e) => e.preventDefault()}>
                <DrawerHeader>
                  <DrawerTitle>{tituloFolha}</DrawerTitle>
                  <DrawerDescription className="sr-only">Escolha o dia no calendário.</DrawerDescription>
                  <DrawerClose asChild>
                    <Button variant="texto" size="icone" aria-label="Fechar">
                      <X aria-hidden="true" />
                    </Button>
                  </DrawerClose>
                </DrawerHeader>
                <div className="px-5 pb-5">{calendario}</div>
              </DrawerContent>
            </Drawer>
          </>
        )
      }}
    </FormField>
  )
}
