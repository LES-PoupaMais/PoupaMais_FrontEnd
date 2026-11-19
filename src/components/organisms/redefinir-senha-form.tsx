'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { ActionBanner } from '@/components/molecules/action-banner'
import { OfflineMotivo } from '@/components/molecules/offline-banner'
import { PasswordField } from '@/components/molecules/password-field'
import { redefinirSenhaSchema, type RedefinirSenhaInput } from '@/schemas/auth.schema'

// "Criar nova senha" (prancheta redefinir-celular): nova senha com ajuda, confirmação, "Salvar nova senha" e o aviso de que
// as outras sessões são encerradas. Puro: envia por `onSubmit` (o token da URL fica com a tela).
export type RedefinirSenhaFormProps = {
  onSubmit: (dados: RedefinirSenhaInput) => void
  enviando?: boolean
  erro?: string | null
  semConexao?: boolean
}

export function RedefinirSenhaForm({ onSubmit, enviando = false, erro, semConexao = false }: RedefinirSenhaFormProps) {
  const motivoId = useId()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirSenhaInput>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  })

  return (
    <div className="flex flex-col gap-6">
      <form
        method="post"
        aria-label="Criar nova senha"
        noValidate
        onSubmit={handleSubmit((dados) => onSubmit(dados))}
        className="flex flex-col gap-4"
      >
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          help="Mínimo de 6 caracteres."
          {...register('novaSenha')}
          error={errors.novaSenha?.message}
        />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          {...register('confirmarSenha')}
          error={errors.confirmarSenha?.message}
        />
        {erro && <ActionBanner variante="erro" texto={erro} />}
        <Button
          type="submit"
          className="mt-2 w-full"
          loading={enviando}
          disabled={semConexao}
          aria-describedby={semConexao ? motivoId : undefined}
        >
          Salvar nova senha
        </Button>
        {semConexao && <OfflineMotivo id={motivoId} />}
      </form>
      <p className="text-legenda text-muted-foreground flex items-center justify-center gap-2 text-center">
        <LogOut className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        Ao salvar, as outras sessões abertas são encerradas.
      </p>
    </div>
  )
}
