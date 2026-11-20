import { useSyncExternalStore } from 'react'

const nada = () => () => {}

/**
 * `false` no servidor e durante a hidratação; `true` depois dela (e sempre que o componente monta já no navegador).
 * Serve para o que só existe no cliente (o tema escolhido pelo next-themes, dados que o cache já tem): renderizar o
 * mesmo que o servidor na hidratação e trocar logo depois, sem erro de hidratação.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    nada,
    () => true,
    () => false,
  )
}
