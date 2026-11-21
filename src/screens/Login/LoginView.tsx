'use client'

import Link from 'next/link'
import { ActionBanner } from '@/components/molecules/action-banner'
import { OfflineBanner } from '@/components/molecules/offline-banner'
import { LoginForm } from '@/components/organisms/login-form'
import { AuthTemplate } from '@/components/templates/auth-template'
import { ROTAS } from '@/constants/rotas'
import { useLoginContext } from './LoginContext'

// Pranchetas login-celular/-computador/-erro/-escuro e sessao-vencida-celular.
export function LoginView() {
  const { sessaoVencida, destinoDescrito, hrefEsqueci, enviando, erro, online, entrar } = useLoginContext()
  const aviso = (sessaoVencida || !online) && (
    <>
      {sessaoVencida && <ActionBanner variante="atencao" texto="Sua sessão venceu. Entre de novo para continuar." />}
      {!online && <OfflineBanner variante="canto" />}
    </>
  )

  return (
    <AuthTemplate
      titulo={sessaoVencida ? 'Entre de novo' : 'Bem-vindo de volta'}
      subtitulo={
        sessaoVencida ? `Depois de entrar, você volta para ${destinoDescrito}.` : 'Entre na sua conta para continuar.'
      }
      aviso={aviso}
      rodape={
        <>
          Não tem conta?{' '}
          <Link href={ROTAS.cadastro} className="text-corpo-forte text-primary hover:text-primaria-hover underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm onSubmit={entrar} enviando={enviando} erro={erro} semConexao={!online} hrefEsqueci={hrefEsqueci} />
    </AuthTemplate>
  )
}
