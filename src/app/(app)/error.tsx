'use client'

import { ErroGeralView } from '@/screens/ErroGeral'

// Erro inesperado numa tela da área logada: aparece dentro da casca (sidebar e barra inferior continuam). Só rota.
export default function ErroDaArea({ retry }: { error: unknown; retry: () => void }) {
  return <ErroGeralView area="logada" onTentarDeNovo={retry} />
}
