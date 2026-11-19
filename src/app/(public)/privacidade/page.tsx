import type { Metadata } from 'next'
import { PrivacidadeProvider, PrivacidadeView } from '@/screens/Privacidade'

export const metadata: Metadata = { title: 'Política de privacidade · PoupaMais' }

// Só rota: Provider + View da tela (src/screens/Privacidade).
export default function PrivacidadePage() {
  return (
    <PrivacidadeProvider>
      <PrivacidadeView />
    </PrivacidadeProvider>
  )
}
