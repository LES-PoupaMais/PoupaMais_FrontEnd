'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { toast } from 'sonner'
import { cadastroAction } from '@/actions/auth.actions'
import { ROTAS } from '@/constants/rotas'
import { useOnline } from '@/hooks/use-online'
import { traduzirErro } from '@/lib/http'
import type { CadastroInput } from '@/schemas/auth.schema'

// Cadastro (RF009, RN011): a `cadastroAction` cria a conta e já entra (grava o cookie). Depois: cache limpo, toast e Dashboard.
// `409` = e-mail já usado (no próprio campo); `400` = erros por campo; o resto vira aviso traduzido (lib/http).
export const ERRO_EMAIL_USADO = 'Já existe uma conta com esse e-mail.'

type CadastroContextValue = {
  linkPrivacidade: string
  enviando: boolean
  erro: string | null
  errosDaApi: Record<string, string> | undefined
  online: boolean
  cadastrar: (dados: CadastroInput) => void
}

const CadastroContext = createContext<CadastroContextValue | null>(null)

export function CadastroProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const online = useOnline()
  const [enviando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [errosDaApi, setErrosDaApi] = useState<Record<string, string>>()

  const cadastrar = (dados: CadastroInput) =>
    iniciar(async () => {
      setErro(null)
      setErrosDaApi(undefined)
      const resultado = await cadastroAction(dados)
      if (resultado.ok) {
        queryClient.clear()
        toast.success('Conta criada. Este é o seu mês.')
        router.replace(ROTAS.dashboard)
        return
      }
      // Pelo contrato, 409 no cadastro = e-mail já usado: vai no campo E-mail, com a mensagem da API como veio
      const traduzido = traduzirErro(resultado, { porStatus: { 409: ERRO_EMAIL_USADO } })
      if (resultado.status === 409) {
        setErrosDaApi({ email: traduzido.mensagem })
        return
      }
      if (Object.keys(traduzido.campos).length > 0) setErrosDaApi(traduzido.campos)
      else setErro(traduzido.mensagem)
    })

  return (
    <CadastroContext.Provider
      value={{ linkPrivacidade: ROTAS.privacidade, enviando, erro, errosDaApi, online, cadastrar }}
    >
      {children}
    </CadastroContext.Provider>
  )
}

export function useCadastroContext() {
  const contexto = useContext(CadastroContext)
  if (!contexto) throw new Error('useCadastroContext precisa estar dentro de <CadastroProvider>')
  return contexto
}
