'use client'

import { ChevronLeft, KeyRound, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { OfflineBanner } from '@/components/molecules/offline-banner'
import { EsqueciSenhaEnviado } from '@/components/organisms/esqueci-senha-enviado'
import { EsqueciSenhaForm } from '@/components/organisms/esqueci-senha-form'
import { AuthTemplate } from '@/components/templates/auth-template'
import { useEsqueciSenhaContext } from './EsqueciSenhaContext'

// Pranchetas esqueci-celular e esqueci-enviado-celular.
export function EsqueciSenhaView() {
  const { enviadoPara, emailInicial, enviando, erro, online, hrefLogin, pedirLink, enviarDeNovo } =
    useEsqueciSenhaContext()

  // "‹ Entrar" no topo, só no celular (pranchetas esqueci-celular e esqueci-enviado-celular)
  const voltarAoLogin = (
    <Link
      href={hrefLogin}
      className="text-corpo-forte text-primary hover:text-primaria-hover inline-flex min-h-11 items-center gap-1"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      Entrar
    </Link>
  )

  if (enviadoPara !== null) {
    return (
      <AuthTemplate
        titulo="Confira o seu e-mail"
        subtitulo={`Pedido recebido para ${enviadoPara}.`}
        icone={{ Icone: MailCheck, tom: 'receita' }}
        acaoCelular={voltarAoLogin}
      >
        <EsqueciSenhaEnviado hrefLogin={hrefLogin} onEnviarDeNovo={enviarDeNovo} />
      </AuthTemplate>
    )
  }

  return (
    <AuthTemplate
      titulo="Esqueci minha senha"
      subtitulo="Informe o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova."
      icone={{ Icone: KeyRound, tom: 'primaria' }}
      acaoCelular={voltarAoLogin}
      aviso={!online && <OfflineBanner variante="canto" />}
      rodape={
        <>
          Lembrou a senha?{' '}
          <Link href={hrefLogin} className="text-corpo-forte text-primary hover:text-primaria-hover underline">
            Entrar
          </Link>
        </>
      }
    >
      <EsqueciSenhaForm
        onSubmit={pedirLink}
        enviando={enviando}
        erro={erro}
        semConexao={!online}
        emailInicial={emailInicial}
      />
    </AuthTemplate>
  )
}
