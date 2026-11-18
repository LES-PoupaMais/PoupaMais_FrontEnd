import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/atoms/logo'

// Telas de acesso (login, cadastro, esqueci e redefinir senha, sessão vencida). Seguem o tema (claro ou escuro):
// card central com o logo, título e subtítulo; rodapé com a página inicial e a política de privacidade.
// Prancheta de referência: ../Documentação/design/telas/project/login-computador.dc.html (e as variantes -celular).
export type AuthTemplateProps = {
  titulo: string
  subtitulo?: string
  /** Formulário e avisos da tela */
  children: ReactNode
  /** Abaixo do formulário, dentro do card: "Não tem conta? Criar conta" */
  rodape?: ReactNode
}

export function AuthTemplate({ titulo, subtitulo, children, rodape }: AuthTemplateProps) {
  return (
    <div data-slot="auth-template" className="bg-background text-foreground flex min-h-screen flex-col">
      <main className="grid flex-1 place-items-center px-5 pt-12 pb-6 md:px-8">
        <div className="bg-card text-card-foreground border-border rounded-grande shadow-card flex w-full max-w-[440px] flex-col gap-6 border px-6 py-8 sm:px-10">
          <Link href="/" aria-label="PoupaMais, ir para a página inicial" className="self-center">
            <Logo className="h-[72px]" />
          </Link>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-titulo-1">{titulo}</h1>
            {subtitulo && <p className="text-corpo text-muted-foreground">{subtitulo}</p>}
          </div>
          {children}
          {rodape && <div className="text-corpo text-muted-foreground text-center">{rodape}</div>}
        </div>
      </main>
      <RodapePublico />
    </div>
  )
}

export function RodapePublico() {
  return (
    <footer className="text-legenda flex flex-wrap justify-center gap-6 px-5 pt-4 pb-6 md:px-8">
      <Link href="/" className="text-primary inline-flex min-h-11 items-center font-bold">
        Página inicial
      </Link>
      <Link href="/privacidade" className="text-primary inline-flex min-h-11 items-center font-bold">
        Política de privacidade
      </Link>
      <span className="text-muted-foreground inline-flex items-center">© 2026 PoupaMais</span>
    </footer>
  )
}
