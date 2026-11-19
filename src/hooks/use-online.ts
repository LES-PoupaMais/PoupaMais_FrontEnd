import { useSyncExternalStore } from 'react'

// Conexão do navegador (DS: OfflineBanner). `navigator.onLine` + eventos `online`/`offline`. No servidor, considera online.
function assinar(avisar: () => void) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

/** `false` quando o navegador está sem internet (mostrar o OfflineBanner e desabilitar o que grava) */
export function useOnline(): boolean {
  return useSyncExternalStore(
    assinar,
    () => navigator.onLine,
    () => true,
  )
}
