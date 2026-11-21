import { EsqueciSenhaProvider, EsqueciSenhaView } from '@/screens/EsqueciSenha'

// Só rota: Provider + View da tela (src/screens/EsqueciSenha).
export default function EsqueciSenhaPage() {
  return (
    <EsqueciSenhaProvider>
      <EsqueciSenhaView />
    </EsqueciSenhaProvider>
  )
}
