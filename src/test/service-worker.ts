import { vi } from 'vitest'

/**
 * `navigator.serviceWorker` falso (o jsdom não tem). Com `ativo`, há um service worker controlando a página que
 * responde a cada mensagem pela porta recebida, como o `public/sw.js`. Devolve os espiões e a função que desfaz.
 */
export function simularServiceWorker({ ativo = true, responde = true } = {}) {
  const postMessage = vi.fn((_mensagem: unknown, portas: MessagePort[] = []) => {
    if (responde) portas[0]?.postMessage({ tipo: 'dados-limpos' })
  })
  const register = vi.fn(async () => ({ scope: '/' }) as ServiceWorkerRegistration)
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { controller: ativo ? { postMessage } : null, register },
  })
  const desfazer = () => {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker
  }
  return { postMessage, register, desfazer }
}
