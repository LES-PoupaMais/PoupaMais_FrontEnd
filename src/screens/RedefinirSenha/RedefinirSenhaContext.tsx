'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ROTAS } from '@/constants/rotas'
import { useOnline } from '@/hooks/use-online'
import { useRedefinirSenha } from '@/hooks/use-recuperacao-senha'
import { ErroApi, traduzirErro } from '@/lib/http'
import type { RedefinirSenhaInput } from '@/schemas/auth.schema'

// Redefinir senha (/redefinir-senha?token=…, link do e-mail, RN014). `204` → toast e login; `422` (token inválido,
// expirado ou já usado) ou link sem token → estado "Este link expirou"; o resto vira aviso traduzido.
type RedefinirSenhaContextValue = {
  linkExpirado: boolean
  enviando: boolean
  erro: string | null
  online: boolean
  hrefPedirOutro: string
  hrefLogin: string
  salvar: (dados: RedefinirSenhaInput) => void
}

const RedefinirSenhaContext = createContext<RedefinirSenhaContextValue | null>(null)

export function RedefinirSenhaProvider({ token, children }: { token?: string | string[]; children: ReactNode }) {
  const router = useRouter()
  const online = useOnline()
  const redefinir = useRedefinirSenha()
  const valorDoToken = (Array.isArray(token) ? token[0] : token)?.trim() ?? ''
  const [expirado, setExpirado] = useState(false)

  const salvar = ({ novaSenha }: RedefinirSenhaInput) =>
    redefinir.mutate(
      { token: valorDoToken, novaSenha },
      {
        onSuccess: () => {
          toast.success('Senha nova salva. Entre com ela.')
          router.replace(ROTAS.login)
        },
        onError: (erro) => {
          if (erro instanceof ErroApi && erro.status === 422) setExpirado(true)
        },
      },
    )

  const erroGeral = redefinir.isError && !expirado ? traduzirErro(redefinir.error).mensagem : null

  return (
    <RedefinirSenhaContext.Provider
      value={{
        linkExpirado: expirado || valorDoToken === '',
        enviando: redefinir.isPending,
        erro: erroGeral,
        online,
        hrefPedirOutro: ROTAS.esqueciSenha,
        hrefLogin: ROTAS.login,
        salvar,
      }}
    >
      {children}
    </RedefinirSenhaContext.Provider>
  )
}

export function useRedefinirSenhaContext() {
  const contexto = useContext(RedefinirSenhaContext)
  if (!contexto) throw new Error('useRedefinirSenhaContext precisa estar dentro de <RedefinirSenhaProvider>')
  return contexto
}
