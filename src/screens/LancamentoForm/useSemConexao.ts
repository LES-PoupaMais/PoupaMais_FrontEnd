import { useSyncExternalStore } from 'react'

// Sem internet (navigator.onLine + eventos online/offline). No servidor, considera conectado.
function assinar(avisar: () => void) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

export function useSemConexao(): boolean {
  return useSyncExternalStore(
    assinar,
    () => !navigator.onLine,
    () => false,
  )
}
