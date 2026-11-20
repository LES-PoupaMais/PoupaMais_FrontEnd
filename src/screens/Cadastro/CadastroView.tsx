'use client'

import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { OfflineBanner } from '@/components/molecules/offline-banner'
import { CadastroForm } from '@/components/organisms/cadastro-form'
import { CadastroLateral } from '@/components/organisms/cadastro-lateral'
import { AuthTemplate } from '@/components/templates/auth-template'
import { ROTAS } from '@/constants/rotas'
import { useCadastroContext } from './CadastroContext'

// Pranchetas cadastro-celular, cadastro-computador (texto de apoio à esquerda, topo com "Já tenho conta") e
// cadastro-validacao-celular.
export function CadastroView() {
  const { linkPrivacidade, enviando, erro, errosDaApi, online, cadastrar } = useCadastroContext()
  return (
    <AuthTemplate
      titulo="Criar conta"
      subtitulo="Comece a organizar as suas finanças pelo mês atual."
      subtituloComLateral="Só nome, e-mail e senha."
      aviso={!online && <OfflineBanner variante="canto" />}
      lateral={<CadastroLateral />}
      acaoComputador={
        <Button asChild variant="texto">
          <Link href={ROTAS.login}>Já tenho conta</Link>
        </Button>
      }
      rodape={
        <>
          Já tem conta?{' '}
          <Link href={ROTAS.login} className="text-corpo-forte text-primary hover:text-primaria-hover underline">
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
