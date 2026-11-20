'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Check, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/atoms/dialog'
import { Input } from '@/components/atoms/input'
import { ActionBanner } from '@/components/molecules/action-banner'
import { FormField } from '@/components/molecules/form-field'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { categoriaSchema, type CategoriaInput } from '@/schemas/categoria.schema'
import type { Categoria } from '@/types/api'

// Diálogo de categoria (pranchetas categoria-nova, categoria-editar e categoria-em-uso; criar pelo campo do formulário em
// nova-categoria-inline): o mesmo visual do ConfirmDialog, com o campo Nome (RN002: trim, obrigatório, até 255).
// - Nova: "Criar categoria". Editar: "Salvar", mais "Inativar categoria" e "Excluir categoria" (só sem lançamentos).
// - `erroNome` (ex.: 409 "Já existe uma categoria com esse nome.") aparece no campo até a pessoa mudar o nome.
// - `avisoEmUso` (DELETE respondeu 422): a `mensagem` da API num aviso de atenção no lugar das ações, oferecendo
//   "Inativar categoria". A confirmação antes do DELETE fica com a tela (ConfirmDialog).
// Puro: aberto, envio e erros chegam por props; quem chama a API é o Context da tela.

export type CategoriaDialogProps = {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  /** Com categoria = editar; sem = nova */
  categoria?: Categoria | null
  /** Nome já preenchido ao criar (ex.: o texto digitado na busca do campo de categorias) */
  nomeInicial?: string
  /** Frase abaixo do título (opcional) */
  texto?: ReactNode
  rotuloNome?: string
  /** Ajuda do campo; o padrão muda entre nova e editar */
  ajuda?: string
  onSalvar: (descricao: string) => void
  salvando?: boolean
  /** Erro do campo vindo da API (já traduzido) */
  erroNome?: string | null
  /** Editar: inativar a categoria (sem ele, o botão não aparece) */
  onInativar?: () => void
  inativando?: boolean
  /** Editar: excluir a categoria (sem ele, o botão não aparece) */
  onExcluir?: () => void
  excluindo?: boolean
  /** A exclusão foi recusada porque a categoria está em uso: a mensagem da API (já traduzida) */
  avisoEmUso?: string | null
  /** Sem internet: nada é gravado e o motivo aparece embaixo */
  semConexao?: boolean
}

const AJUDA_NOVA = 'Ela aparece na hora para escolher nos lançamentos.'
const AJUDA_EDITAR = 'O nome muda em todos os lançamentos que usam esta categoria.'

export function CategoriaDialog({
  aberto,
  onAbertoChange,
  salvando,
  inativando,
  excluindo,
  ...props
}: CategoriaDialogProps) {
  const ocupado = Boolean(salvando || inativando || excluindo)
  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        // enquanto grava, Esc e o véu não fecham (o resultado precisa voltar para o diálogo)
        if (!abrir && ocupado) return
        onAbertoChange(abrir)
      }}
    >
      <DialogContent showCloseButton={false} data-slot="categoria-dialog" className="max-w-100 sm:max-w-100">
        <Formulario
          {...props}
          salvando={salvando}
          inativando={inativando}
          excluindo={excluindo}
          ocupado={ocupado}
          onCancelar={() => onAbertoChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type FormularioProps = Omit<CategoriaDialogProps, 'aberto' | 'onAbertoChange'> & {
  ocupado: boolean
  onCancelar: () => void
}

// Monta a cada abertura (o conteúdo do Dialog desmonta ao fechar): o formulário sempre começa do nome atual
function Formulario({
  categoria,
  nomeInicial = '',
  texto,
  rotuloNome = 'Nome',
  ajuda,
  onSalvar,
  salvando = false,
  erroNome,
  onInativar,
  inativando = false,
  onExcluir,
  excluindo = false,
  avisoEmUso = null,
  semConexao = false,
  ocupado,
  onCancelar,
}: FormularioProps) {
  const base = useId()
  const editar = Boolean(categoria)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoriaInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { descricao: categoria?.descricao ?? nomeInicial },
  })
  // O erro da API vale para o nome enviado; ao mudar o nome, ele some
  const [enviado, setEnviado] = useState<string | null>(null)
  const nomeAtual = useWatch({ control, name: 'descricao' }) ?? ''
  const erroDaApi = erroNome && enviado !== null && nomeAtual.trim() === enviado ? erroNome : null
  const motivoId = `${base}-motivo`
  const bloqueio = semConexao ? { 'aria-disabled': true as const, 'aria-describedby': motivoId } : {}

  const enviar = handleSubmit(({ descricao }) => {
    if (semConexao || ocupado) return
    const limpo = descricao.trim()
    setEnviado(limpo)
    onSalvar(limpo)
  })

  const mostrarAcoes = editar && !avisoEmUso && (onInativar || onExcluir)

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
      <DialogTitle className="pr-0">{editar ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
      {texto ? (
        <DialogDescription>{texto}</DialogDescription>
      ) : (
        <DialogDescription className="sr-only">
          {editar ? 'Renomeie, inative ou exclua a categoria.' : 'Dê um nome para a nova categoria.'}
        </DialogDescription>
      )}

      <FormField
        label={rotuloNome}
        required
        help={ajuda ?? (editar ? AJUDA_EDITAR : AJUDA_NOVA)}
        error={errors.descricao?.message ?? erroDaApi}
      >
        <Input type="text" maxLength={255} autoComplete="off" {...register('descricao')} />
      </FormField>

      {editar && avisoEmUso && onInativar && (
        <ActionBanner
          variante="atencao"
          texto={avisoEmUso}
          acoes={[{ rotulo: 'Inativar categoria', onClick: () => !semConexao && !ocupado && onInativar() }]}
        />
      )}

      {mostrarAcoes && (
        <div className="border-border flex flex-col gap-3 border-t pt-4">
          {onInativar && (
            <div className="flex flex-col gap-1">
              <Button
                variant="contornado"
                size="pequeno"
                className="min-h-11 self-start"
                loading={inativando}
                disabled={ocupado && !inativando}
                aria-describedby={`${base}-inativar`}
                onClick={() => !semConexao && onInativar()}
                {...bloqueio}
              >
                <EyeOff aria-hidden="true" />
                Inativar categoria
              </Button>
              <span id={`${base}-inativar`} className="text-legenda text-muted-foreground">
                Ela sai da lista de escolha. Os lançamentos que já usam continuam com ela.
              </span>
            </div>
          )}
          {onExcluir && (
            <div className="flex flex-col gap-1">
              <Button
                variant="perigo-texto"
                size="pequeno"
                className="min-h-11 self-start"
                loading={excluindo}
                disabled={ocupado && !excluindo}
                aria-describedby={`${base}-excluir`}
                onClick={() => !semConexao && onExcluir()}
                {...bloqueio}
              >
                <Trash2 aria-hidden="true" />
                Excluir categoria
              </Button>
              <span id={`${base}-excluir`} className="text-legenda text-muted-foreground">
                Só para categorias sem nenhum lançamento.
              </span>
            </div>
          )}
        </div>
      )}

      <div
        data-slot="categoria-dialog-acoes"
        className="mt-2 grid grid-cols-1 gap-3 sm:ml-auto sm:w-fit sm:max-w-full sm:auto-cols-[minmax(120px,1fr)] sm:grid-flow-col sm:grid-cols-none"
      >
        <Button variant="contornado" className="w-full px-5" disabled={ocupado} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" className="w-full px-5" loading={salvando} disabled={ocupado && !salvando} {...bloqueio}>
          {!salvando && (editar ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />)}
          {editar ? 'Salvar' : 'Criar categoria'}
        </Button>
      </div>
      {semConexao && <OfflineMotivo id={motivoId} />}
    </form>
  )
}
