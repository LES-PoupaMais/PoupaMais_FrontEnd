import { useSyncExternalStore } from 'react'

// Ajuda do ambiente do navegador usada só pelo Perfil (se outra tela precisar, vira hook global). O download usa lib/baixar-arquivo.

const nada = () => () => {}

/** `true` só no navegador, depois da hidratação (o tema escolhido só existe no cliente). */
export function useMontado(): boolean {
  return useSyncExternalStore(
    nada,
    () => true,
    () => false,
  )
}
