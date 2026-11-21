import { vi } from 'vitest'

/**
 * `navigator.serviceWorker` falso (o jsdom não tem). Com `ativo`, há um service worker controlando a página que
 * responde a cada mensagem pela porta recebida, como o `public/sw.js`; `assumir()` simula um service worker passando
 * a controlar a página. Devolve os espiões, `assumir` e a função que desfaz.
 */
export function simularServiceWorker({ ativo = true, responde = true } = {}) {
  const postMessage = vi.fn((_mensagem: unknown, portas: MessagePort[] = []) => {
    if (responde) portas[0]?.postMessage({ tipo: 'dados-limpos' })
  })
  const register = vi.fn(async () => ({ scope: '/' }) as ServiceWorkerRegistration)
  const alvo = new EventTarget()
  const servico = {
    controller: ativo ? { postMessage } : null,
    register,
    addEventListener: alvo.addEventListener.bind(alvo),
    removeEventListener: alvo.removeEventListener.bind(alvo),
  }
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: servico })
  /** Um service worker passa a controlar a página (evento `controllerchange`) */
  const assumir = () => {
    servico.controller = { postMessage }
    alvo.dispatchEvent(new Event('controllerchange'))
  }
  const desfazer = () => {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker
  }
  return { postMessage, register, assumir, desfazer }
}
