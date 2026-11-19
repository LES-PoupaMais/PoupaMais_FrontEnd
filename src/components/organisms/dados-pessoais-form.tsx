'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { UserPen } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { FormField } from '@/components/molecules/form-field'
import { NOME_MAXIMO, nomeSchema, type NomeInput } from '@/schemas/perfil.schema'
import { PerfilSecao } from './perfil-secao'

// Bloco "Dados" do Perfil (RN015): nome editável (≤ 150) e e-mail só para leitura, com a ajuda
// "O e-mail não pode ser alterado.". "Salvar nome" é contornado (o Perfil não tem botão preenchido).

export type DadosPessoaisFormProps = {
  nome: string
  email: string
  enviando?: boolean
  /** Erro do nome vindo da API (`erros[]`) */
  erroNome?: string | null
  onSubmit: (dados: { nome: string }) => void
  bloqueado?: boolean
  idMotivo?: string
}

export function DadosPessoaisForm({
  nome,
  email,
  enviando = false,
  erroNome,
  onSubmit,
  bloqueado = false,
  idMotivo,
}: DadosPessoaisFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<NomeInput>({ resolver: zodResolver(nomeSchema), defaultValues: { nome } })

  // Nome salvo (ou recarregado): o campo passa a mostrar o valor do servidor
  useEffect(() => reset({ nome }), [nome, reset])
  useEffect(() => {
    if (erroNome) setError('nome', { message: erroNome })
  }, [erroNome, setError])

  return (
    <PerfilSecao titulo="Dados" icone={UserPen}>
      <form
        method="post"
        aria-label="Dados pessoais"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((dados) => onSubmit({ nome: dados.nome.trim() }))}
      >
        <FormField label="Nome" error={errors.nome?.message}>
          <Input type="text" autoComplete="name" maxLength={NOME_MAXIMO} {...register('nome')} />
        </FormField>
        <FormField label="E-mail" help="O e-mail não pode ser alterado.">
          <Input type="email" value={email} readOnly className="bg-secondary text-muted-foreground" />
        </FormField>
        <Button
          type="submit"
          variant="contornado"
          className="self-start"
          loading={enviando}
          disabled={bloqueado}
          aria-describedby={bloqueado ? idMotivo : undefined}
        >
          Salvar nome
        </Button>
      </form>
    </PerfilSecao>
  )
}
