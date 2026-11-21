import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

// "Descartar alterações?" ao sair do formulário com alterações não salvas (DS: Navegação e layout, Formulários):
// - links da página inteira (‹ da TopBar, sidebar, Cancelar…): o clique é interceptado na captura, antes do next/link;
// - botões que saem da página marcados com `data-confirmar-saida` (o "Sair" da sidebar): mesmo diálogo; ao descartar,
//   o clique é repetido já liberado;
// - Voltar do navegador: com alterações, uma entrada extra no histórico (mesma URL) segura o primeiro "voltar";
// - recarregar ou fechar a aba: o aviso nativo do navegador (beforeunload).
// `perguntar` abre o diálogo; `descartar` segue o caminho que a pessoa escolheu; `cancelar` fica na página.
export type PedidoDeSaida = { descartar: () => void; cancelar?: () => void }

export function useAvisoAoSair(sujo: boolean, perguntar: (pedido: PedidoDeSaida) => void) {
  const router = useRouter()
  const sujoRef = useRef(sujo)
  const perguntarRef = useRef(perguntar)
  const liberadoRef = useRef(false)
  const guardaRef = useRef(false)

  useEffect(() => {
    sujoRef.current = sujo
    perguntarRef.current = perguntar
  })

  useEffect(() => {
    if (!sujo) return
    const aoDescarregar = (evento: BeforeUnloadEvent) => {
      if (liberadoRef.current) return
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', aoDescarregar)
    return () => window.removeEventListener('beforeunload', aoDescarregar)
  }, [sujo])

  useEffect(() => {
    if (sujo && !guardaRef.current && !liberadoRef.current) {
      window.history.pushState(window.history.state, '', window.location.href)
      guardaRef.current = true
    }
  }, [sujo])

  useEffect(() => {
    const aoVoltar = () => {
      if (!guardaRef.current || liberadoRef.current) return
      guardaRef.current = false
      if (!sujoRef.current) {
        // a guarda ficou de quando havia alterações: o "voltar" segue direto
        window.history.back()
        return
      }
      perguntarRef.current({
        descartar: () => {
          liberadoRef.current = true
          window.history.back()
        },
        cancelar: () => {
          window.history.pushState(window.history.state, '', window.location.href)
          guardaRef.current = true
        },
      })
    }
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  useEffect(() => {
    const aoClicar = (evento: MouseEvent) => {
      if (!sujoRef.current || liberadoRef.current || evento.defaultPrevented) return
      if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return
      const saida = (evento.target as Element | null)?.closest?.('[data-confirmar-saida]')
      if (saida instanceof HTMLElement) {
        evento.preventDefault()
        evento.stopPropagation()
        perguntarRef.current({
          descartar: () => {
            liberadoRef.current = true
            saida.click()
          },
        })
        return
      }
      const link = (evento.target as Element | null)?.closest?.('a[href]')
      if (!(link instanceof HTMLAnchorElement)) return
      if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return
      const destino = new URL(link.href, window.location.href)
      if (destino.origin !== window.location.origin) return
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) return
      evento.preventDefault()
      evento.stopPropagation()
      perguntarRef.current({
        descartar: () => {
          liberadoRef.current = true
          router.push(`${destino.pathname}${destino.search}${destino.hash}`)
        },
      })
    }
    document.addEventListener('click', aoClicar, true)
    return () => document.removeEventListener('click', aoClicar, true)
  }, [router])

  /** Sai sem perguntar (depois de salvar ou mover para a lixeira) */
  return {
    liberar: () => {
      liberadoRef.current = true
    },
    /** Havia a entrada extra no histórico (use `router.replace` para sair sem deixá-la para trás) */
    temGuarda: () => guardaRef.current,
  }
}
