import { LandingProvider, LandingView } from '@/screens/Landing'

// Só rota: Provider + View da tela (src/screens/Landing).
export default function LandingPage() {
  return (
    <LandingProvider>
      <LandingView />
    </LandingProvider>
  )
}
