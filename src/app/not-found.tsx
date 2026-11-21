import { Suspense } from 'react'
import { NaoEncontrado, NaoEncontradoView } from '@/screens/NaoEncontrado'

// 404 global. Só rota: a tela decide as saídas pelo cookie (lido dentro do <Suspense>).
export default function NotFound() {
  return (
    <Suspense fallback={<NaoEncontradoView logado={false} />}>
      <NaoEncontrado />
    </Suspense>
  )
}
