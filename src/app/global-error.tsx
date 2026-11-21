'use client'

import { ErroGlobalView } from '@/screens/ErroGeral'
import { plusJakarta } from '@/styles/fonts'
import '@/styles/globals.css'

// Erro no layout raiz: substitui o app/layout.tsx inteiro, por isso tem <html>/<body> próprios, a fonte e o CSS global
// (exigência do Next). Sem `metadata` (Client Component): o título vai na tag <title>. `retry` (Next 16) monta de novo.
export default function ErroGlobal({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR" className={`h-full ${plusJakarta.variable}`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <title>PoupaMais</title>
        <ErroGlobalView onTentarDeNovo={retry} />
      </body>
    </html>
  )
}
