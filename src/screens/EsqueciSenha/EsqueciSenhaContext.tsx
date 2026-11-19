'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { ROTAS } from '@/constants/rotas'
import { useOnline } from '@/hooks/use-online'
import { useRecuperarSenha } from '@/hooks/use-recuperacao-senha'
import { traduzirErro } from '@/lib/http'
import type { RecuperarSenhaInput } from '@/schemas/auth.schema'

// Esqueci a senha (RN014): pede o link e mostra "Confira o seu e-mail" com o mesmo texto, exista a conta ou não.
// Só falha de rede/servidor vira aviso (traduzido); "Enviar de novo" volta ao formulário com o e-mail preenchido.
type EsqueciSenhaContextValue = {
  /** E-mail do último pedido aceito; `null` = mostrando o formulário */
  enviadoPara: string | null
  emailInicial: string
  enviando: boolean
  erro: string | null
  online: boolean
  hrefLogin: string
  pedirLink: (dados: RecuperarSenhaInput) => void
  enviarDeNovo: () => void
}

const EsqueciSenhaContext = createContext<EsqueciSenhaContextValue | null>(null)

export function EsqueciSenhaProvider({ children }: { children: ReactNode }) {
  const online = useOnline()
  const recuperar = useRecuperarSenha()
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null)
  const [emailInicial, setEmailInicial] = useState('')

  const pedirLink = (dados: RecuperarSenhaInput) => {
    setEmailInicial(dados.email)
    recuperar.mutate({ email: dados.email.trim() }, { onSuccess: () => setEnviadoPara(dados.email.trim()) })
  }

  const enviarDeNovo = () => {
    recuperar.reset()
    setEnviadoPara(null)
  }

  return (
    <EsqueciSenhaContext.Provider
      value={{
        enviadoPara,
        emailInicial,
        enviando: recuperar.isPending,
        erro: recuperar.isError ? traduzirErro(recuperar.error).mensagem : null,
        online,
        hrefLogin: ROTAS.login,
        pedirLink,
        enviarDeNovo,
      }}
    >
      {children}
    </EsqueciSenhaContext.Provider>
  )
}

export function useEsqueciSenhaContext() {
  const contexto = useContext(EsqueciSenhaContext)
  if (!contexto) throw new Error('useEsqueciSenhaContext precisa estar dentro de <EsqueciSenhaProvider>')
  return contexto
}
