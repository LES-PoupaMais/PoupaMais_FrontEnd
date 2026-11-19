'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { ActionBanner } from '@/components/molecules/action-banner'
import { EmailField } from '@/components/molecules/email-field'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { recuperarSenhaSchema, type RecuperarSenhaInput } from '@/schemas/auth.schema'

// "Esqueci minha senha" (prancheta esqueci-celular): só o e-mail e "Enviar link". Puro: envia por `onSubmit`.
export type EsqueciSenhaFormProps = {
  onSubmit: (dados: RecuperarSenhaInput) => void
  enviando?: boolean
  emailInicial?: string
  /** Erro geral já traduzido (ex.: sem conexão com o servidor) */
  erro?: string | null
  semConexao?: boolean
}

export function EsqueciSenhaForm({
  onSubmit,
  enviando = false,
  emailInicial = '',
  erro,
  semConexao = false,
}: EsqueciSenhaFormProps) {
  const motivoId = useId()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarSenhaInput>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: emailInicial },
  })

  return (
    <form
      method="post"
      aria-label="Pedir link para redefinir a senha"
      noValidate
      onSubmit={handleSubmit((dados) => onSubmit(dados))}
      className="flex flex-col gap-4"
    >
      <EmailField {...register('email')} error={errors.email?.message} />
      {erro && <ActionBanner variante="erro" texto={erro} />}
      <Button
        type="submit"
        className="w-full"
        loading={enviando}
        disabled={semConexao}
        aria-describedby={semConexao ? motivoId : undefined}
      >
        Enviar link
      </Button>
      {semConexao && <OfflineMotivo id={motivoId} />}
    </form>
  )
}
