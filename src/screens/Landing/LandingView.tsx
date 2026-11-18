'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/atoms/button'
import { PublicTemplate } from '@/components/templates/public-template'
import { ROTAS } from '@/constants/rotas'
import { useLandingContext } from './LandingContext'

// PLACEHOLDER (B1): mínimo para a rota funcionar no padrão novo. O visual final (hero, seções) vem com os
// organismos do B2/B4, seguindo landing-celular.dc.html e landing-computador.dc.html.
export function LandingView() {
  const { destaques } = useLandingContext()
  return (
    <PublicTemplate>
      <section className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-rotulo-secao text-receita uppercase">Gestão financeira pessoal e familiar</p>
        <h1 className="text-display max-w-3xl">
          Veja para onde vai o seu dinheiro <span className="text-receita">em cada mês.</span>
        </h1>
        <Link href={ROTAS.cadastro} className={buttonVariants({ size: 'xl' })}>
          Começar gratuitamente
        </Link>
      </section>
      <ul className="grid gap-4 pb-16 md:grid-cols-3">
        {destaques.map((destaque) => (
          <li key={destaque.titulo} className="bg-card border-border rounded-card shadow-card border p-6">
            <h2 className="text-titulo-3">{destaque.titulo}</h2>
            <p className="text-corpo text-muted-foreground mt-2">{destaque.texto}</p>
          </li>
        ))}
      </ul>
    </PublicTemplate>
  )
}
