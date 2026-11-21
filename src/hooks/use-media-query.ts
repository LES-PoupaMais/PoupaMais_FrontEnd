import { useCallback, useSyncExternalStore } from 'react'

/** Larguras do Design System (as mesmas do Tailwind): md = 768px (tablet), lg = 1024px (computador) */
export const MIDIA = {
  tablet: '(min-width: 768px)',
  computador: '(min-width: 1024px)',
} as const

/**
 * `true` quando a media query casa. No servidor (e na hidratação) devolve `false`; por isso, layout que depende
 * da largura deve ser feito com CSS (md:, lg:, trilho:). Use este hook só para comportamento (ex.: o que o
 * botão de alternar a sidebar faz) e atributos ARIA.
 */
export function useMediaQuery(consulta: string): boolean {
  const assinar = useCallback(
    (avisar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    [consulta],
  )
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}
