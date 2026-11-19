'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/atoms/dialog'
import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { categoriaSchema, type CategoriaInput } from '@/schemas/categoria.schema'

// "Nova categoria" aberta pelo "+ Criar nova categoria" do campo de categorias do lançamento (prancheta
// nova-categoria-inline-celular). Puro: a tela cria (POST /categorias), mostra o 409 em `erro` e fecha ao terminar.
// A tela Categorias tem o seu próprio diálogo (criar, renomear, inativar); este só cria.
export type NovaCategoriaDialogProps = {
  aberto: boolean
  /** Texto que a pessoa digitou na busca (vira o nome sugerido) */
  nomeInicial?: string
  /** Criando: botão com spinner (RNF006) */
  enviando?: boolean
  /** Erro da API no nome (ex.: 409 "Já existe uma categoria com esse nome") */
  erro?: string | null
  onCancelar: () => void
  onCriar: (descricao: string) => void
}

const ID_FORM = 'nova-categoria-form'

export function NovaCategoriaDialog({
  aberto,
  nomeInicial = '',
  enviando = false,
  erro,
  onCancelar,
  onCriar,
}: NovaCategoriaDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoriaInput>({ resolver: zodResolver(categoriaSchema), defaultValues: { descricao: nomeInicial } })

  // reabrir começa do texto da busca, sem o erro anterior
  useEffect(() => {
    if (aberto) reset({ descricao: nomeInicial })
  }, [aberto, nomeInicial, reset])

  useEffect(() => {
    if (erro) setError('descricao', { type: 'server', message: erro }, { shouldFocus: true })
  }, [erro, setError])

  const busca = nomeInicial.trim()

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        if (!abrir && !enviando) onCancelar()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogTitle>Nova categoria</DialogTitle>
        <DialogDescription className={busca ? undefined : 'sr-only'}>
          {busca
            ? `Você digitou "${busca}" na busca. Confira o nome antes de criar.`
            : 'Dê um nome curto para a categoria.'}
        </DialogDescription>
        <form
          id={ID_FORM}
          noValidate
          onSubmit={(evento) => {
            // o diálogo abre por cima do formulário do lançamento: o envio não pode subir para ele
            evento.stopPropagation()
            void handleSubmit(({ descricao }) => onCriar(descricao.trim()))(evento)
          }}
        >
          <FormField
            label="Nome da categoria"
            required
            help="Ela já entra escolhida neste lançamento."
            error={errors.descricao?.message}
          >
            <Input type="text" maxLength={255} autoComplete="off" autoFocus {...register('descricao')} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="contornado" disabled={enviando} onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="submit" form={ID_FORM} loading={enviando}>
            <Plus aria-hidden="true" />
            Criar categoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
