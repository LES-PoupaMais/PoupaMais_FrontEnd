'use client'

import Link from 'next/link'
import { AuthTemplate } from '@/components/templates/auth-template'
import { ROTAS } from '@/constants/rotas'
import { useCadastroContext } from './CadastroContext'

// PLACEHOLDER (B1): o formulário (organismo cadastro-form) entra no B4.
export function CadastroView() {
  const { linkPrivacidade } = useCadastroContext()
  return (
    <AuthTemplate
      titulo="Criar conta"
      subtitulo="Comece a controlar suas finanças hoje."
      rodape={
        <>
          Já tem conta?{' '}
          <Link href={ROTAS.login} className="text-primary font-bold">
            Entrar
          </Link>
        </>
      }
    >
      <p className="text-legenda text-muted-foreground text-center">
        O formulário de cadastro entra na próxima etapa. Leia a{' '}
        <Link href={linkPrivacidade} className="text-primary font-bold">
          Política de Privacidade
        </Link>
        .
      </p>
    </AuthTemplate>
  )
}
