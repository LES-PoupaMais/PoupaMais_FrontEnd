'use client'

import { ErroGeralView } from '@/screens/ErroGeral'

// Erro inesperado fora da área logada. Só rota: `retry` (Next 16) tenta montar a página de novo.
export default function Erro({ retry }: { error: unknown; retry: () => void }) {
  return <ErroGeralView area="publica" onTentarDeNovo={retry} />
}
