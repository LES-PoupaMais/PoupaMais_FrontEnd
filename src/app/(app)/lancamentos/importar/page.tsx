import { ImportarProvider, ImportarView } from '@/screens/Importar'

// Só rota. A tela não lê a URL: o arquivo, o envio e o resultado ficam no Context.
export default function ImportarPage() {
  return (
    <ImportarProvider>
      <ImportarView />
    </ImportarProvider>
  )
}
