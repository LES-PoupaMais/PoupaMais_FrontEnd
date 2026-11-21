'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { guardarPaginaOffline, quandoServiceWorkerAssumir } from '@/lib/service-worker'

/**
 * PWA: a cada troca de tela pela navegação interna do Next (link, `router.push`/`replace`), pede ao service worker que
 * guarde a página completa, para ela abrir sem internet (CLAUDE.md, seção "PWA"). A página carregada inteira já passa
 * pelo service worker; só na primeira visita (aberta antes de ele assumir) o pedido sai quando ele assumir.
 * Lê a URL com `useSearchParams`: fica dentro de um `<Suspense>` (AppProviders). Não desenha nada.
 */
export function GuardarTelaOffline() {
  const caminho = usePathname()
  // Fora do roteador do Next (testes de outras telas que montam o AppProviders) os dois vêm null
  const busca = useSearchParams()?.toString() ?? ''
  const primeiraVez = useRef(true)

  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return quandoServiceWorkerAssumir(() => guardarPaginaOffline(window.location.href))
    }
    guardarPaginaOffline(window.location.href)
  }, [caminho, busca])

  return null
}
