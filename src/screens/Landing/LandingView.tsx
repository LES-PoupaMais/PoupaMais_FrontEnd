'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/atoms/button'
import { LandingBeneficios } from '@/components/organisms/landing-beneficios'
import { LandingDados } from '@/components/organisms/landing-dados'
import { LandingHero } from '@/components/organisms/landing-hero'
import { LandingPassos } from '@/components/organisms/landing-passos'
import { PublicTemplate } from '@/components/templates/public-template'
import { cn } from '@/lib/cn'
import { useLandingContext } from './LandingContext'

// Topo: "Entrar" em texto no celular e contornado no computador, com "Privacidade" a partir de 768px (pranchetas).
export function LandingView() {
  const { hrefCadastro, hrefLogin, hrefPrivacidade } = useLandingContext()
  return (
    <PublicTemplate
      variante="site"
      acoes={
        <>
          <Link href={hrefPrivacidade} className={cn(buttonVariants({ variant: 'texto' }), 'hidden md:inline-flex')}>
            Privacidade
          </Link>
          <Link
            href={hrefLogin}
            className={cn(
              buttonVariants({ variant: 'texto' }),
              'lg:border-input lg:text-foreground lg:hover:bg-secondary lg:px-6',
            )}
          >
            Entrar
          </Link>
        </>
      }
    >
      <LandingHero hrefCadastro={hrefCadastro} hrefLogin={hrefLogin} />
      <LandingBeneficios />
      <LandingPassos />
      <LandingDados hrefPrivacidade={hrefPrivacidade} hrefCadastro={hrefCadastro} />
    </PublicTemplate>
  )
}
