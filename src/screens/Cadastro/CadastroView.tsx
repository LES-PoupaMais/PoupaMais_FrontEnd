'use client'

import Link from 'next/link'
import { OfflineBanner } from '@/components/molecules/offline-banner'
import { CadastroForm } from '@/components/organisms/cadastro-form'
import { CadastroLateral } from '@/components/organisms/cadastro-lateral'
import { AuthTemplate } from '@/components/templates/auth-template'
import { ROTAS } from '@/constants/rotas'
import { useCadastroContext } from './CadastroContext'

// Pranchetas cadastro-celular, cadastro-computador (texto de apoio à esquerda) e cadastro-validacao-celular.
export function CadastroView() {
  const { linkPrivacidade, enviando, erro, errosDaApi, online, cadastrar } = useCadastroContext()
  return (
    <AuthTemplate
      titulo="Criar conta"
      subtitulo="Comece a organizar as suas finanças pelo mês atual."
      aviso={!online && <OfflineBanner variante="canto" />}
      lateral={<CadastroLateral />}
      rodape={
        <>
          Já tem conta?{' '}
          <Link href={ROTAS.login} className="text-corpo-forte text-primary">
            Entrar
          </Link>
        </>
      }
    >
      <CadastroForm
        onSubmit={cadastrar}
        enviando={enviando}
        erro={erro}
        errosDaApi={errosDaApi}
        semConexao={!online}
        hrefPrivacidade={linkPrivacidade}
      />
    </AuthTemplate>
  )
}
