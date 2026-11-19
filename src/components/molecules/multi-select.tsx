'use client'

import { ChevronDown, Pencil, Plus, Search } from 'lucide-react'
import { useId, useState, type MouseEvent } from 'react'
import { Button } from '@/components/atoms/button'
import { Checkbox } from '@/components/atoms/checkbox'
import { Input } from '@/components/atoms/input'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/atoms/popover'
import { Skeleton } from '@/components/atoms/skeleton'
import { Chip } from '@/components/molecules/chip'
import { MarcaObrigatorio, MensagemErro, juntarIds } from '@/components/molecules/form-field'
import { cn } from '@/lib/cn'

// Escolha múltipla do Design System (components/MultiSelect), genérica: as opções vêm por props e as escolhidas viram chips
// NEUTROS removíveis. Painel com busca, "+ Criar nova <item>" sempre primeiro (vira "Criar "<texto>"" com texto na busca),
// caixas de seleção reais e o lápis de editar (botão separado, não marca nem desmarca). Inativas ficam no fim, esmaecidas e
// não selecionáveis. Quem cria/edita (modal, API, invalidação) é quem usa: aqui só `onCreate(texto)` e `onEdit(valor)`.

export type OpcaoMultiSelect<T extends string | number> = {
  value: T
  label: string
  /** Inativa: aparece no grupo "Inativas", desabilitada (o lápis continua para reativar) */
  inativa?: boolean
}

export type MultiSelectProps<T extends string | number> = {
  /** Rótulo visível ("Categorias") */
  label: string
  options: ReadonlyArray<OpcaoMultiSelect<T>>
  value: ReadonlyArray<T>
  onChange: (valores: T[]) => void
  /** Mostra "+ Criar nova …" e recebe o texto da busca (vazio quando não há busca) */
  onCreate?: (texto: string) => void
  /** Mostra o lápis em cada opção */
  onEdit?: (valor: T) => void
  /** Nome de uma opção, no singular e minúsculo: "categoria" → "Buscar categoria", "Editar categoria Mercado" */
  nomeDoItem?: string
  /** Texto do botão de criar (padrão "Criar nova <item>") */
  rotuloCriar?: string
  placeholder?: string
  error?: string | null
  required?: boolean
  disabled?: boolean
  /** Lista ainda carregando: skeleton de 3 linhas */
  carregando?: boolean
  className?: string
}

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()

const porNome = <T extends string | number>(a: OpcaoMultiSelect<T>, b: OpcaoMultiSelect<T>) =>
  a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })

export function MultiSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
  onCreate,
  onEdit,
  nomeDoItem = 'categoria',
  rotuloCriar = `Criar nova ${nomeDoItem}`,
  placeholder = 'Escolha uma ou mais',
  error,
  required = false,
  disabled = false,
  carregando = false,
  className,
}: MultiSelectProps<T>) {
  const base = useId()
  const rotuloId = `${base}-rotulo`
  const erroId = `${base}-erro`
  const inativaId = `${base}-inativa`
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const escolhidos = value
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is OpcaoMultiSelect<T> => Boolean(o))
  const termo = normalizar(busca)
  const filtradas = options.filter((o) => normalizar(o.label).includes(termo))
  const ativas = filtradas.filter((o) => !o.inativa).sort(porNome)
  const inativas = filtradas.filter((o) => o.inativa).sort(porNome)
  const nomeLista = label.toLocaleLowerCase('pt-BR')

  const alternar = (opcao: OpcaoMultiSelect<T>, marcar: boolean) => {
    if (opcao.inativa) return
    onChange(marcar ? [...value, opcao.value] : value.filter((v) => v !== opcao.value))
  }

  const abrirPeloCampo = (evento: MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    if ((evento.target as HTMLElement).closest('button')) return
    setAberto(true)
  }

  const mudarAberto = (abrir: boolean) => {
    setAberto(abrir)
    if (!abrir) setBusca('')
  }

  const criar = () => {
    const texto = busca.trim()
    mudarAberto(false)
    onCreate?.(texto)
  }

  const item = (opcao: OpcaoMultiSelect<T>) => {
    const marcado = value.includes(opcao.value)
    return (
      <li key={String(opcao.value)} className="hover:bg-secondary rounded-campo flex items-center">
        <label
          className={cn(
            'flex min-h-11 flex-1 cursor-pointer items-center gap-3 px-2 py-2.5',
            opcao.inativa && 'cursor-not-allowed opacity-55',
          )}
        >
          <Checkbox
            checked={marcado}
            disabled={opcao.inativa}
            aria-describedby={opcao.inativa ? inativaId : undefined}
            onCheckedChange={(estado) => alternar(opcao, estado === true)}
          />
          <span className="text-corpo truncate">{opcao.label}</span>
        </label>
        {onEdit && (
          <Button
            variant="texto"
            size="icone"
            className="text-muted-foreground hover:bg-accent hover:text-primary rounded-campo"
            aria-label={`Editar ${nomeDoItem} ${opcao.label}${opcao.inativa ? ' (inativa)' : ''}`}
            onClick={() => {
              mudarAberto(false)
              onEdit(opcao.value)
            }}
          >
            <Pencil aria-hidden="true" />
          </Button>
        )}
      </li>
    )
  }

  return (
    <div data-slot="multi-select" className={cn('flex w-full flex-col gap-1.5', className)}>
      <span id={rotuloId} className="text-rotulo-campo text-foreground">
        {label}
        {required && <MarcaObrigatorio />}
      </span>
      <Popover open={aberto} onOpenChange={mudarAberto}>
        <PopoverAnchor asChild>
          <div
            role="group"
            aria-labelledby={rotuloId}
            aria-describedby={juntarIds(error && erroId)}
            data-aberto={aberto || undefined}
            data-invalid={error ? true : undefined}
            onClick={abrirPeloCampo}
            className={cn(
              'border-input bg-card rounded-campo flex min-h-11 w-full items-center gap-2 border-[1.5px] py-1 pr-1 pl-2 transition-colors',
              !disabled && 'not-data-invalid:hover:border-muted-foreground cursor-pointer',
              aberto && 'border-primary',
              error && 'border-destructive bg-erro-fundo',
              disabled && 'border-border bg-secondary cursor-not-allowed',
            )}
          >
            {escolhidos.length > 0 ? (
              <ul aria-label={`${label} escolhidas`} className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {escolhidos.map((opcao) => (
                  <li key={String(opcao.value)} className="max-w-full">
                    <Chip
                      className="min-h-[30px]"
                      disabled={disabled}
                      onRemove={() => onChange(value.filter((v) => v !== opcao.value))}
                    >
                      {opcao.label}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-corpo text-muted-foreground flex-1 pl-1">{placeholder}</span>
            )}
            <PopoverTrigger asChild>
              <Button
                variant="texto"
                size="icon-sm"
                disabled={disabled}
                aria-label={`${aberto ? 'Fechar' : 'Abrir'} lista de ${nomeLista}`}
                aria-describedby={juntarIds(error && erroId)}
                aria-invalid={error ? true : undefined}
                className="text-muted-foreground rounded-sm"
              >
                <ChevronDown aria-hidden="true" className={cn('transition-transform', aberto && 'rotate-180')} />
              </Button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" aria-labelledby={rotuloId} className="w-[min(400px,calc(100vw-2rem))] gap-1 p-2">
          <div className="relative mb-1 flex items-center">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 size-5" aria-hidden="true" />
            <Input
              type="search"
              aria-label={`Buscar ${nomeDoItem}`}
              placeholder={`Buscar ${nomeDoItem}`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          {onCreate && (
            <>
              <button
                type="button"
                onClick={criar}
                className="text-primary hover:bg-accent rounded-campo flex min-h-11 w-full items-center gap-2 px-2 text-left font-bold"
              >
                <Plus className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{busca.trim() ? `Criar "${busca.trim()}"` : rotuloCriar}</span>
              </button>
              <div role="presentation" className="bg-border my-1 h-px" />
            </>
          )}
          {carregando ? (
            <div aria-busy="true" aria-label={`Carregando ${nomeLista}`} className="flex flex-col gap-2 p-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : ativas.length + inativas.length === 0 ? (
            <p className="text-legenda text-muted-foreground px-2 py-3">
              Nenhuma {nomeDoItem} encontrada{busca.trim() ? ` para "${busca.trim()}"` : ''}.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col overflow-auto">
              {ativas.map(item)}
              {inativas.length > 0 && (
                <li aria-hidden="true" className="text-mini text-muted-foreground px-2 pt-2 pb-1 uppercase">
                  Inativas
                </li>
              )}
              {inativas.map(item)}
            </ul>
          )}
          <span id={inativaId} className="sr-only">
            {`${nomeDoItem.charAt(0).toLocaleUpperCase('pt-BR')}${nomeDoItem.slice(1)} inativa: reative pelo lápis para poder escolher.`}
          </span>
        </PopoverContent>
      </Popover>
      {error && <MensagemErro id={erroId}>{error}</MensagemErro>}
    </div>
  )
}
