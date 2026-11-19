import { obterToken } from '@/lib/session'
import { NaoEncontradoView } from './NaoEncontradoView'

// Servidor: decide as saídas do 404 pela presença do cookie (logado → Dashboard e Lançamentos; senão → página inicial).
// Lê cookies(), então fica dentro de <Suspense> (cacheComponents).
export async function NaoEncontrado() {
  const logado = Boolean(await obterToken())
  return <NaoEncontradoView logado={logado} />
}
