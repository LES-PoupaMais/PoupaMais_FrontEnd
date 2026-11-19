'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/atoms/button'
import { PasswordField } from '@/components/molecules/password-field'
import { trocarSenhaSchema, type TrocarSenhaInput } from '@/schemas/perfil.schema'
import { PerfilSecao } from './perfil-secao'

// Bloco "Alterar senha" do Perfil (RN015; prancheta perfil-senha-celular): senha atual, nova (mínimo de 6 e diferente da
// atual) e confirmação. Valida ao sair do campo ("As senhas não são iguais."). O erro da API ("A senha atual está incorreta.")
// volta pelo `controle.definirErro`; deu certo, a tela chama `controle.limpar()`.

type CampoSenha = keyof TrocarSenhaInput

/** O que a tela usa para devolver o resultado ao formulário */
export type ControleAlterarSenha = {
  definirErro: (campo: CampoSenha, mensagem: string) => void
  limpar: () => void
}

export type AlterarSenhaFormProps = {
  enviando?: boolean
  onSubmit: (dados: TrocarSenhaInput, controle: ControleAlterarSenha) => void
  bloqueado?: boolean
  idMotivo?: string
}

const VAZIO: TrocarSenhaInput = { senhaAtual: '', novaSenha: '', confirmarSenha: '' }

export function AlterarSenhaForm({ enviando = false, onSubmit, bloqueado = false, idMotivo }: AlterarSenhaFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<TrocarSenhaInput>({ resolver: zodResolver(trocarSenhaSchema), mode: 'onTouched', defaultValues: VAZIO })

  const controle: ControleAlterarSenha = {
    definirErro: (campo, mensagem) => {
      setError(campo, { message: mensagem })
      setFocus(campo)
    },
    limpar: () => reset(VAZIO),
  }

  return (
    <PerfilSecao titulo="Alterar senha" icone={KeyRound}>
      <form
        method="post"
        aria-label="Alterar senha"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((dados) => onSubmit(dados, controle))}
      >
        <PasswordField
          label="Senha atual"
          autoComplete="current-password"
          error={errors.senhaAtual?.message}
          {...register('senhaAtual')}
        />
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          help="Mínimo de 6 caracteres e diferente da atual."
          error={errors.novaSenha?.message}
          {...register('novaSenha')}
        />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmarSenha?.message}
          {...register('confirmarSenha')}
        />
        <Button
          type="submit"
          variant="contornado"
          className="self-start"
          loading={enviando}
          disabled={bloqueado}
          aria-describedby={bloqueado ? idMotivo : undefined}
        >
          Alterar senha
        </Button>
      </form>
    </PerfilSecao>
  )
}
