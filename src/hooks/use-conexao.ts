import { useSyncExternalStore } from 'react'

function assinar(avisar: () => void) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

/**
 * `true` enquanto o navegador está com internet (`navigator.onLine`). No servidor devolve `true`.
 * Sem internet, a tela mostra o OfflineBanner e desabilita os botões que gravam (DS: estados de toda tela).
 */
export function useConexao(): boolean {
  return useSyncExternalStore(
    assinar,
    () => navigator.onLine,
    () => true,
  )
}
