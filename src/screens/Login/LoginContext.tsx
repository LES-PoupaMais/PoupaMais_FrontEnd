'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import { loginAction } from '@/actions/auth.actions'
import { topoDaRota } from '@/constants/navegacao'
import { ROTAS } from '@/constants/rotas'
import { useOnline } from '@/hooks/use-online'
import { destinoSeguro } from '@/lib/destino'
import { traduzirErro } from '@/lib/http'
import type { LoginInput } from '@/schemas/auth.schema'

// Login (RF010) e Sessão vencida (/login?voltar=…&sessao=vencida, vindo do AppProviders). Entrar chama a `loginAction`
// (grava o cookie httpOnly), limpa o cache do TanStack Query (nada da sessão anterior aparece) e volta para `?voltar=`
// (só caminho interno, `destinoSeguro`). Erro de credencial é sempre o mesmo texto: nunca diz se foi o e-mail ou a senha.
export const ERRO_CREDENCIAIS = 'E-mail ou senha incorretos.'

type LoginContextValue = {
  voltarPara: string
  sessaoVencida: boolean
  /** "a tela Novo lançamento" / "a página em que estava" (subtítulo da sessão vencida) */
  destinoDescrito: string
  hrefEsqueci: string
  enviando: boolean
  erro: string | null
  online: boolean
  entrar: (dados: LoginInput) => void
}

const LoginContext = createContext<LoginContextValue | null>(null)

function descreverDestino(destino: string): string {
  const { titulo } = topoDaRota(destino.split(/[?#]/)[0])
  return titulo === 'PoupaMais' ? 'a página em que estava' : `a tela ${titulo}`
}

export function LoginProvider({
  voltar,
  sessao,
  children,
}: {
  voltar?: string | string[]
  sessao?: string | string[]
  children: ReactNode
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const online = useOnline()
  const [enviando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const voltarPara = destinoSeguro(voltar)
  const sessaoVencida = (Array.isArray(sessao) ? sessao[0] : sessao) === 'vencida'

  const entrar = (dados: LoginInput) =>
    iniciar(async () => {
      setErro(null)
      const resultado = await loginAction(dados)
      if (resultado.ok) {
        queryClient.clear()
        router.replace(voltarPara)
        return
      }
      const credencial = resultado.status === 401 || resultado.status === 400
      setErro(credencial ? ERRO_CREDENCIAIS : traduzirErro(resultado).mensagem)
    })

  return (
    <LoginContext.Provider
      value={{
        voltarPara,
        sessaoVencida,
        destinoDescrito: descreverDestino(voltarPara),
        hrefEsqueci: ROTAS.esqueciSenha,
        enviando,
        erro,
        online,
        entrar,
      }}
    >
      {children}
    </LoginContext.Provider>
  )
}

export function useLoginContext() {
  const contexto = useContext(LoginContext)
  if (!contexto) throw new Error('useLoginContext precisa estar dentro de <LoginProvider>')
  return contexto
}
