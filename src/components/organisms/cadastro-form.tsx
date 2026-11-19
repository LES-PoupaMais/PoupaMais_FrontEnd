'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { Checkbox } from '@/components/atoms/checkbox'
import { Input } from '@/components/atoms/input'
import { ActionBanner } from '@/components/molecules/action-banner'
import { EmailField } from '@/components/molecules/email-field'
import { FormField, MensagemErro } from '@/components/molecules/form-field'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { PasswordField } from '@/components/molecules/password-field'
import { cadastroSchema, type CadastroInput } from '@/schemas/auth.schema'

// Formulário de cadastro (pranchetas cadastro-*, cadastro-validacao): nome, e-mail, senha (ajuda "Mínimo de 6 caracteres."),
// confirmação e aceite da Política de Privacidade (RN011, link abre em nova aba). Ao tentar enviar com erros, um aviso no topo
// conta os campos destacados. Puro: envia por `onSubmit`; erros da API chegam traduzidos em `errosDaApi` (campo → mensagem).
export type CadastroFormProps = {
  onSubmit: (dados: CadastroInput) => void
  enviando?: boolean
  /** Erros por campo vindos da API, já traduzidos (ex.: 409 → `{ email: 'Já existe uma conta com esse e-mail.' }`) */
  errosDaApi?: Record<string, string>
  /** Aviso de erro geral acima do botão (sem conexão com o servidor etc.) */
  erro?: string | null
  semConexao?: boolean
  hrefPrivacidade: string
}

const VAZIO: CadastroInput = { nome: '', email: '', senha: '', confirmarSenha: '', aceiteTermos: false }

function resumo(quantidade: number) {
  return quantidade === 1 ? 'Confira o campo destacado abaixo.' : `Confira os ${quantidade} campos destacados abaixo.`
}

export function CadastroForm({
  onSubmit,
  enviando = false,
  errosDaApi,
  erro,
  semConexao = false,
  hrefPrivacidade,
}: CadastroFormProps) {
  const motivoId = useId()
  const aceiteErroId = useId()
  const [comErros, setComErros] = useState(0)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CadastroInput>({ resolver: zodResolver(cadastroSchema), defaultValues: VAZIO })

  useEffect(() => {
    for (const [campo, mensagem] of Object.entries(errosDaApi ?? {})) {
      if (campo in VAZIO) setError(campo as keyof CadastroInput, { message: mensagem }, { shouldFocus: true })
    }
  }, [errosDaApi, setError])

  const enviar = handleSubmit(
    (dados) => {
      setComErros(0)
      onSubmit(dados)
    },
    (falhas: FieldErrors<CadastroInput>) => setComErros(Object.keys(falhas).length),
  )

  return (
    <form aria-label="Criar conta" noValidate onSubmit={enviar} className="flex flex-col gap-4">
      {comErros > 0 && <ActionBanner variante="erro" texto={resumo(comErros)} />}
      <FormField label="Nome completo" error={errors.nome?.message}>
        <Input autoComplete="name" placeholder="Ex.: Ana Souza" {...register('nome')} />
      </FormField>
      <EmailField {...register('email')} error={errors.email?.message} />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        help="Mínimo de 6 caracteres."
        {...register('senha')}
        error={errors.senha?.message}
      />
      <PasswordField
        label="Confirmar senha"
        autoComplete="new-password"
        {...register('confirmarSenha')}
        error={errors.confirmarSenha?.message}
      />
      <Controller
        control={control}
        name="aceiteTermos"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex min-h-11 items-center gap-3">
              <Checkbox
                id="aceite-termos"
                ref={field.ref}
                checked={field.value}
                onCheckedChange={(marcado) => field.onChange(marcado === true)}
                onBlur={field.onBlur}
                aria-invalid={errors.aceiteTermos ? true : undefined}
                aria-describedby={errors.aceiteTermos ? aceiteErroId : undefined}
              />
              <label htmlFor="aceite-termos" className="text-corpo">
                Li e aceito a{' '}
                <Link
                  href={hrefPrivacidade}
                  target="_blank"
                  rel="noopener"
                  className="text-primary font-bold underline"
                >
                  Política de Privacidade
                </Link>
              </label>
            </div>
            {errors.aceiteTermos?.message && (
              <MensagemErro id={aceiteErroId}>{errors.aceiteTermos.message}</MensagemErro>
            )}
          </div>
        )}
      />
      {erro && <ActionBanner variante="erro" texto={erro} />}
      <Button
        type="submit"
        className="mt-2 w-full"
        loading={enviando}
        disabled={semConexao}
        aria-describedby={semConexao ? motivoId : undefined}
      >
        Criar conta
      </Button>
      {semConexao && <OfflineMotivo id={motivoId} />}
    </form>
  )
}
