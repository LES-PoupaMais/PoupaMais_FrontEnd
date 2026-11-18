import { CadastroProvider, CadastroView } from '@/screens/Cadastro'

// Só rota: Provider + View da tela (src/screens/Cadastro).
export default function CadastroPage() {
  return (
    <CadastroProvider>
      <CadastroView />
    </CadastroProvider>
  )
}
