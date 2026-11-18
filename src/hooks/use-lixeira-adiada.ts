import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useMoverParaLixeira } from './use-mutacoes-lancamento'

// "Mover para a lixeira" sem modal (CLAUDE.md "Conta no saldo e Lixeira"): a linha some na hora e o DELETE só vai quando o
// toast "Movido para a lixeira · Desfazer" fecha sem Desfazer (ou ao sair da página, no `pagehide`).
// A fila é global (vale entre telas: mover pela visualização e voltar para a lista mantém a linha escondida).

const naFila = new Set<number>()
const enviando = new Set<number>()
const ouvintes = new Set<() => void>()
const VAZIO: ReadonlySet<number> = new Set()
let retrato: ReadonlySet<number> = VAZIO

function avisar() {
  retrato = new Set(naFila)
  ouvintes.forEach((ouvinte) => ouvinte())
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

/** Ids esperando o toast fechar: as listas escondem estes lançamentos */
export function useFilaDaLixeira(): ReadonlySet<number> {
  return useSyncExternalStore(
    assinar,
    () => retrato,
    () => VAZIO,
  )
}

/**
 * `adiar(id)` esconde a linha; `desfazer(id)` traz de volta sem chamar a API; `confirmar(id)` envia o DELETE
 * (uma vez só) e tira da fila depois que a lista foi recarregada. Em erro, a linha volta e a Promise rejeita.
 */
export function useMoverParaLixeiraAdiado() {
  const { mutateAsync } = useMoverParaLixeira()

  const adiar = useCallback((id: number) => {
    naFila.add(id)
    avisar()
  }, [])

  const desfazer = useCallback((id: number) => {
    if (enviando.has(id)) return
    if (naFila.delete(id)) avisar()
  }, [])

  const confirmar = useCallback(
    async (id: number) => {
      if (!naFila.has(id) || enviando.has(id)) return
      enviando.add(id)
      try {
        await mutateAsync(id)
      } finally {
        enviando.delete(id)
        naFila.delete(id)
        avisar()
      }
    },
    [mutateAsync],
  )

  // Saindo da página (fechar a aba, recarregar): envia o que estava esperando
  useEffect(() => {
    const aoSair = () => naFila.forEach((id) => void confirmar(id).catch(() => {}))
    window.addEventListener('pagehide', aoSair)
    return () => window.removeEventListener('pagehide', aoSair)
  }, [confirmar])

  return { adiar, desfazer, confirmar }
}
