'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { Input } from '@/components/atoms/input'
import { Switch } from '@/components/atoms/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/atoms/tooltip'
import { ActionBanner } from '@/components/molecules/action-banner'
import { DatePicker } from '@/components/molecules/date-picker'
import { FormField } from '@/components/molecules/form-field'
import { MoneyField } from '@/components/molecules/money-field'
import { MultiSelect, type OpcaoMultiSelect } from '@/components/molecules/multi-select'
import { SegmentedControl } from '@/components/molecules/segmented-control'
import { cn } from '@/lib/cn'
import { DESCRICAO_MAXIMO, lancamentoSchema, type LancamentoDados } from '@/schemas/lancamento.schema'
import type { Categoria, TipoLancamento } from '@/types/api'

// Formulário de Novo/Editar lançamento (pranchetas novo-* e editar-*). Puro: React Hook Form + `lancamentoSchema` (RN001),
// `Controller` nos campos controlados (tipo, data, valor, categorias, Conta no saldo). Quem salva, cria categoria e mostra
// toasts é a tela: aqui só `onSubmit(dados)` e `onCriarCategoria(texto, selecionar)`.
// Os botões ficam fora (rodapé fixo no celular, card no computador): ligue-os pelo atributo `form={id}`.

/** O que o formulário guarda enquanto a pessoa preenche (vazio = null) */
export type LancamentoFormValores = {
  descricao: string
  tipo: TipoLancamento | null
  data: string | null
  valor: number | null
  categoriaIds: number[]
  contaNoSaldo: boolean
}

/** O que sai no envio: o corpo da API (RN001) + "Conta no saldo" (ATIVO/INATIVO, enviado à parte pela tela) */
export type LancamentoFormDados = LancamentoDados & { contaNoSaldo: boolean }

/** Erro de campo vindo da API (`erros[]`), mostrado no próprio campo */
export type ErroDeCampo = { campo: string; mensagem: string }

// "Conta no saldo" não faz parte do corpo do POST/PUT; entra só no formulário (o schema da RN001 fica como está)
const formularioSchema = lancamentoSchema.extend({ contaNoSaldo: z.boolean() })

const CAMPOS = ['descricao', 'tipo', 'data', 'valor', 'categoriaIds'] as const
type Campo = (typeof CAMPOS)[number]
const ehCampo = (campo: string): campo is Campo => (CAMPOS as readonly string[]).includes(campo)

export const valoresVazios = (hoje: string): LancamentoFormValores => ({
  descricao: '',
  tipo: null,
  data: hoje,
  valor: null,
  categoriaIds: [],
  contaNoSaldo: true,
})

export type LancamentoFormProps = {
  /** id do <form>, para os botões de fora (`form={id}`) */
  id: string
  valoresIniciais: LancamentoFormValores
  /** Todas as categorias (ativas e inativas); as inativas aparecem desabilitadas */
  categorias: ReadonlyArray<Categoria>
  carregandoCategorias?: boolean
  /** Aviso no topo da lista (ex.: erro ao carregar as categorias) */
  avisoCategorias?: ReactNode
  /** Salvando: campos desabilitados (RNF006) */
  enviando?: boolean
  /** Celular: calendário e lista de categorias na folha de baixo; computador: popover */
  apresentacaoData?: 'popover' | 'folha'
  /** Hoje em ISO (testes) */
  hoje?: string
  /** `erros[]` da API: cada um vai para o seu campo (`setError`) */
  errosDoServidor?: ReadonlyArray<ErroDeCampo>
  onSubmit: (dados: LancamentoFormDados) => void
  /** "+ Criar nova categoria" no campo: a tela cria e chama `selecionar(id)` para a nova já entrar escolhida */
  onCriarCategoria?: (texto: string, selecionar: (id: number) => void) => void
  /** Lápis de cada categoria na lista: a tela abre o diálogo de editar */
  onEditarCategoria?: (idCategoria: number) => void
  /** Avisa quando o formulário passa a ter (ou deixa de ter) alterações não salvas */
  onSujoChange?: (sujo: boolean) => void
  /** Conteúdo depois dos campos (ex.: "Mover para a lixeira" no celular) */
  rodape?: ReactNode
  className?: string
}

function resumoDosErros(quantidade: number) {
  return quantidade === 1
    ? 'Falta 1 informação. Confira o campo marcado.'
    : `Faltam ${quantidade} informações. Confira os campos marcados.`
}

export function LancamentoForm({
  id,
  valoresIniciais,
  categorias,
  carregandoCategorias = false,
  avisoCategorias,
  enviando = false,
  apresentacaoData = 'popover',
  hoje,
  errosDoServidor,
  onSubmit,
  onCriarCategoria,
  onEditarCategoria,
  onSujoChange,
  rodape,
  className,
}: LancamentoFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isDirty, submitCount },
  } = useForm<LancamentoFormValores, unknown, LancamentoFormDados>({
    // os campos vazios (null) são recusados pelo schema com a mensagem de "obrigatório"
    resolver: zodResolver(formularioSchema) as unknown as Resolver<LancamentoFormValores, unknown, LancamentoFormDados>,
    defaultValues: valoresIniciais,
  })
  // Texto da data que não é uma data válida (o DatePicker devolve null): mostra a mensagem dele no lugar de "Informe a data."
  const [dataDigitadaInvalida, setDataDigitadaInvalida] = useState<string | null>(null)

  useEffect(() => {
    onSujoChange?.(isDirty)
  }, [isDirty, onSujoChange])

  useEffect(() => {
    for (const { campo, mensagem } of errosDoServidor ?? []) {
      if (ehCampo(campo)) setError(campo, { type: 'server', message: mensagem }, { shouldFocus: true })
    }
  }, [errosDoServidor, setError])

  const [tipo, valor, descricao, contaNoSaldo] = useWatch({
    control,
    name: ['tipo', 'valor', 'descricao', 'contaNoSaldo'],
  })

  const quantidadeDeErros = CAMPOS.filter((campo) => errors[campo]).length
  const mostrarResumo = submitCount > 0 && quantidadeDeErros > 0 && errors.root === undefined

  const opcoes: OpcaoMultiSelect<number>[] = categorias.map((c) => ({
    value: c.id,
    label: c.descricao,
    inativa: !c.ativa,
  }))

  const selecionarCategoria = (idCategoria: number) => {
    const atuais = getValues('categoriaIds')
    if (!atuais.includes(idCategoria)) {
      setValue('categoriaIds', [...atuais, idCategoria], { shouldDirty: true, shouldValidate: submitCount > 0 })
    }
  }

  return (
    <form
      id={id}
      noValidate
      aria-label="Dados do lançamento"
      aria-busy={enviando || undefined}
      onSubmit={handleSubmit(onSubmit)}
      className={cn('flex flex-col gap-5', className)}
    >
      {mostrarResumo && <ActionBanner variante="erro" texto={resumoDosErros(quantidadeDeErros)} />}
      <p className="text-legenda text-muted-foreground">
        Campos com{' '}
        <span className="text-destructive font-bold" aria-hidden="true">
          *
        </span>
        <span className="sr-only">asterisco</span> são obrigatórios.
      </p>

      <FormField
        label="Descrição"
        required
        disabled={enviando}
        help="Como vai aparecer na lista."
        error={errors.descricao?.message}
        contador={{ atual: descricao.length, maximo: DESCRICAO_MAXIMO }}
      >
        <Input
          type="text"
          maxLength={DESCRICAO_MAXIMO}
          placeholder="Ex.: Mercado do mês"
          autoComplete="off"
          {...register('descricao')}
        />
      </FormField>

      <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-4">
        <Controller
          control={control}
          name="tipo"
          render={({ field, fieldState }) => (
            <SegmentedControl
              label="Tipo"
              required
              bloco
              disabled={enviando}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              options={[
                { value: 'RECEITA', label: 'Receita', funcao: 'receita' },
                { value: 'DESPESA', label: 'Despesa', funcao: 'despesa' },
              ]}
            />
          )}
        />

        <Controller
          control={control}
          name="data"
          render={({ field, fieldState }) => (
            <DatePicker
              label="Data"
              required
              disabled={enviando}
              help="Digite ou escolha no calendário."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
              onTextoInvalido={setDataDigitadaInvalida}
              error={fieldState.error ? (dataDigitadaInvalida ?? fieldState.error.message) : null}
              apresentacao={apresentacaoData}
              hoje={hoje}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name="valor"
        render={({ field, fieldState }) => (
          <MoneyField
            label="Valor"
            required
            disabled={enviando}
            tipo={tipo}
            help={tipo && valor !== null && valor > 0 ? undefined : 'Digite só o número. O sinal (+ ou −) vem do tipo.'}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            name={field.name}
            error={fieldState.error?.message}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        {avisoCategorias}
        <Controller
          control={control}
          name="categoriaIds"
          render={({ field, fieldState }) => (
            <MultiSelect
              label="Categorias"
              required
              disabled={enviando}
              options={opcoes}
              value={field.value}
              onChange={field.onChange}
              carregando={carregandoCategorias}
              apresentacao={apresentacaoData}
              error={fieldState.error?.message}
              onCreate={onCriarCategoria ? (texto) => onCriarCategoria(texto, selecionarCategoria) : undefined}
              onEdit={onEditarCategoria}
            />
          )}
        />
        {!errors.categoriaIds && (
          <p className="text-legenda text-muted-foreground">
            Pode escolher mais de uma. Falta alguma? Crie pela própria lista.
          </p>
        )}
      </div>

      <Controller
        control={control}
        name="contaNoSaldo"
        render={({ field }) => (
          // Divisória acima (prancheta novo-*); a ajuda fica recuada sob o rótulo (switch de 52px + 12px)
          <div className="border-border flex flex-col gap-1 border-t pt-4">
            <div className="flex items-center gap-3">
              <Switch
                id={`${id}-saldo`}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={enviando}
                aria-describedby={`${id}-saldo-ajuda`}
              />
              <label htmlFor={`${id}-saldo`} className="text-corpo-forte">
                Conta no saldo
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="O que é Conta no saldo?"
                    className="text-muted-foreground hover:text-foreground rounded-pilula -ml-2 inline-grid size-11 place-items-center"
                  >
                    <Info className="size-5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  Desligado: o lançamento continua na lista, mas não entra no saldo nem no dashboard.
                </TooltipContent>
              </Tooltip>
            </div>
            <p id={`${id}-saldo-ajuda`} className="text-legenda text-muted-foreground pl-16">
              {contaNoSaldo ? 'Entra no saldo e no dashboard.' : 'Fica na lista, mas fora do saldo e do dashboard.'}
            </p>
          </div>
        )}
      />

      {rodape}
    </form>
  )
}
