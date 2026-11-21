// PWA: registro do service worker (public/sw.js) e limpeza dos dados guardados nele. Regras no CLAUDE.md, seção "PWA".

export const CAMINHO_SERVICE_WORKER = '/sw.js'

/** Mensagem que o `public/sw.js` entende: apaga as respostas de /api/* e as páginas guardadas */
export const MENSAGEM_LIMPAR_DADOS = { tipo: 'limpar-dados' } as const

function temServiceWorker(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * Registra o service worker só no build de produção: no `next dev` ele guardaria arquivos que mudam a cada edição,
 * e nos testes não há o que registrar. Falha no registro (navegador sem suporte, HTTP fora de localhost) não quebra a página.
 */
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (process.env.NODE_ENV !== 'production' || !temServiceWorker()) return null
  try {
    return await navigator.serviceWorker.register(CAMINHO_SERVICE_WORKER, { scope: '/' })
  } catch {
    return null
  }
}

/**
 * Pede ao service worker que apague os dados guardados (logout, sessão vencida, conta excluída), para não sobrar dado
 * de uma pessoa no aparelho. A mensagem sai na hora (antes de a página navegar); a Promise termina quando o service
 * worker confirma ou depois de `esperaMs`, o que vier primeiro. Sem service worker ativo, termina na hora.
 */
export function limparDadosOffline(esperaMs = 1000): Promise<void> {
  const servico = temServiceWorker() ? navigator.serviceWorker.controller : null
  if (!servico) return Promise.resolve()
  return new Promise((resolver) => {
    const canal = new MessageChannel()
    const prazo = setTimeout(resolver, esperaMs)
    canal.port1.onmessage = () => {
      clearTimeout(prazo)
      canal.port1.close()
      resolver()
    }
    servico.postMessage(MENSAGEM_LIMPAR_DADOS, [canal.port2])
  })
}
