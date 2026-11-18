'use client'

import Link from 'next/link'
import { AuthTemplate } from '@/components/templates/auth-template'
import { ROTAS } from '@/constants/rotas'
import { useLoginContext } from './LoginContext'

// PLACEHOLDER (B1): o formulário (organismo login-form) entra no B4.
export function LoginView() {
  const { voltarPara } = useLoginContext()
  return (
    <AuthTemplate
      titulo="Bem-vindo de volta"
      subtitulo="Entre na sua conta para continuar."
      rodape={
        <>
          Não tem conta?{' '}
          <Link href={ROTAS.cadastro} className="text-primary font-bold">
            Criar conta
          </Link>
        </>
      }
    >
      <p className="text-legenda text-muted-foreground text-center" data-voltar-para={voltarPara}>
        O formulário de login entra na próxima etapa.
      </p>
    </AuthTemplate>
  )
}
