'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { ActionBanner } from '@/components/molecules/action-banner'
import { EmailField } from '@/components/molecules/email-field'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { PasswordField } from '@/components/molecules/password-field'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'

// Formulário de login (pranchetas login-*, login-erro, sessao-vencida): e-mail, senha, "Esqueci minha senha", aviso de erro
// acima do botão e "Entrar". Puro: envia por `onSubmit`; o erro já chega traduzido (nunca diz se foi o e-mail ou a senha).
export type LoginFormProps = {
  onSubmit: (dados: LoginInput) => void
  /** Envio em andamento: botão com spinner (RNF006) */
  enviando?: boolean
  /** Aviso de erro acima do botão ("E-mail ou senha incorretos.") */
  erro?: string | null
  /** Sem internet: "Entrar" desabilitado com o motivo */
  semConexao?: boolean
  emailInicial?: string
  hrefEsqueci: string
}

export function LoginForm({
  onSubmit,
  enviando = false,
  erro,
  semConexao = false,
  emailInicial = '',
  hrefEsqueci,
}: LoginFormProps) {
  const motivoId = useId()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: emailInicial, senha: '' } })

  return (
    <form aria-label="Entrar" noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <EmailField {...register('email')} error={errors.email?.message} />
      <PasswordField
        label="Senha"
        autoComplete="current-password"
        {...register('senha')}
        error={errors.senha?.message}
      />
      <Link
        href={hrefEsqueci}
        className="text-corpo-forte text-primary -mt-2 inline-flex min-h-11 items-center self-end"
      >
        Esqueci minha senha
      </Link>
      {erro && <ActionBanner variante="erro" texto={erro} />}
      <Button
        type="submit"
        className="w-full"
        loading={enviando}
        disabled={semConexao}
        aria-describedby={semConexao ? motivoId : undefined}
      >
        Entrar
      </Button>
      {semConexao && <OfflineMotivo id={motivoId} />}
    </form>
  )
}
