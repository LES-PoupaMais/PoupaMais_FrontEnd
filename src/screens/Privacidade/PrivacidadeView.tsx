'use client'

import { PoliticaPrivacidade } from '@/components/organisms/politica-privacidade'
import { PublicTemplate } from '@/components/templates/public-template'
import { usePrivacidadeContext } from './PrivacidadeContext'

// Pranchetas privacidade-celular e privacidade-computador (topo com Entrar e Criar conta, rodapé do site).
export function PrivacidadeView() {
  const { hrefInicio, hrefLogin } = usePrivacidadeContext()
  return (
    <PublicTemplate variante="site">
      <PoliticaPrivacidade hrefInicio={hrefInicio} hrefLogin={hrefLogin} />
    </PublicTemplate>
  )
}
