'use client'

import { Download, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { Input } from '@/components/atoms/input'
import { ConfirmDialog } from '@/components/molecules/confirm-dialog'
import { FormField } from '@/components/molecules/form-field'
import { PasswordField } from '@/components/molecules/password-field'
import { PALAVRA_EXCLUIR_CONTA } from '@/schemas/perfil.schema'

// "Excluir conta" (RN016; DS ConfirmDialog, pranchetas excluir-conta-*): aviso "Não dá para desfazer.", o link
// "Baixar meus dados antes", o campo "Sua senha" (a API exige) e "Para confirmar, digite EXCLUIR". O botão só libera com o
// texto exatamente EXCLUIR e a senha preenchida; o motivo fica no texto de ajuda ("Tudo certo: o botão está liberado." quando sim).
// Compõe o ConfirmDialog (foco em Cancelar, botões do DS, `carregando`) e põe os dois campos nos `children`, porque a ajuda do
// campo digitado aqui fala também da senha. Os campos começam vazios a cada abertura (o conteúdo desmonta ao fechar).

export type ExcluirContaDialogProps = {
  aberto: boolean
  onCancelar: () => void
  onConfirmar: (dados: { senha: string }) => void
  excluindo?: boolean
  /** Erro da API, abaixo do campo de senha ("Senha incorreta.") */
  erroSenha?: string | null
  onBaixarDados: () => void
  baixando?: boolean
}

function CamposDeConfirmacao({
  erroSenha,
  excluindo,
  senha,
  onSenha,
  digitado,
  onDigitado,
  idAjuda,
  liberado,
  onBaixarDados,
  baixando,
}: {
  erroSenha?: string | null
  excluindo: boolean
  senha: string
  onSenha: (v: string) => void
  digitado: string
  onDigitado: (v: string) => void
  idAjuda: string
  liberado: boolean
  onBaixarDados: () => void
  baixando: boolean
}) {
  return (
    <>
      <p className="rounded-campo bg-erro-fundo text-destructive flex items-start gap-2 p-3 text-[13px] leading-[18px] font-semibold">
        <TriangleAlert className="-mt-px size-4 shrink-0" aria-hidden="true" />
        Não dá para desfazer.
      </p>
      <button
        type="button"
        onClick={onBaixarDados}
        disabled={baixando}
        className="text-primary inline-flex min-h-11 cursor-pointer items-center gap-2 self-start font-bold underline underline-offset-3 disabled:cursor-progress"
      >
        {baixando ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-5" aria-hidden="true" />
        )}
        Baixar meus dados antes
      </button>
      <PasswordField
        label="Sua senha"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => onSenha(e.target.value)}
        error={erroSenha}
        disabled={excluindo}
      />
      <FormField label={`Para confirmar, digite ${PALAVRA_EXCLUIR_CONTA}`}>
        <Input
          type="text"
          value={digitado}
          onChange={(e) => onDigitado(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={excluindo}
          aria-describedby={idAjuda}
          className="tracking-[0.04em] tabular-nums"
        />
      </FormField>
      <p id={idAjuda} className="text-legenda text-muted-foreground -mt-2">
        {liberado
          ? 'Tudo certo: o botão está liberado.'
          : `O botão só libera quando o texto for igual a ${PALAVRA_EXCLUIR_CONTA} e a senha estiver preenchida.`}
      </p>
    </>
  )
}

export function ExcluirContaDialog({
  aberto,
  onCancelar,
  onConfirmar,
  excluindo = false,
  erroSenha,
  onBaixarDados,
  baixando = false,
}: ExcluirContaDialogProps) {
  const idAjuda = useId()
  const [senha, setSenha] = useState('')
  const [digitado, setDigitado] = useState('')
  const liberado = digitado.trim() === PALAVRA_EXCLUIR_CONTA && senha.length > 0

  // Fechar zera os campos (a próxima abertura começa vazia)
  const cancelar = () => {
    setSenha('')
    setDigitado('')
    onCancelar()
  }

  return (
    <ConfirmDialog
      aberto={aberto}
      onCancelar={cancelar}
      onConfirmar={() => {
        if (liberado) onConfirmar({ senha })
      }}
      titulo="Excluir conta"
      texto="Sua conta, seus lançamentos, suas categorias e sua foto serão apagados."
      rotuloConfirmar="Excluir conta"
      carregando={excluindo}
      confirmarDesabilitado={!liberado}
    >
      <CamposDeConfirmacao
        erroSenha={erroSenha}
        excluindo={excluindo}
        senha={senha}
        onSenha={setSenha}
        digitado={digitado}
        onDigitado={setDigitado}
        idAjuda={idAjuda}
        liberado={liberado}
        onBaixarDados={onBaixarDados}
        baixando={baixando}
      />
    </ConfirmDialog>
  )
}
