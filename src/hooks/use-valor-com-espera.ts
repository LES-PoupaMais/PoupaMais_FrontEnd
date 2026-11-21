import { useEffect, useState } from 'react'

/** Espera única da busca (Lançamentos): filtra 500 ms depois da última tecla */
export const ESPERA_BUSCA_MS = 500

/**
 * Devolve `valor` só depois de `espera` ms sem mudanças (cada mudança recomeça a contagem).
 * Puro: não sabe de URL nem de API; quem usa decide o que fazer quando o valor com espera muda.
 */
export function useValorComEspera<T>(valor: T, espera: number = ESPERA_BUSCA_MS): T {
  const [comEspera, setComEspera] = useState(valor)
  useEffect(() => {
    const temporizador = setTimeout(() => setComEspera(valor), espera)
    return () => clearTimeout(temporizador)
  }, [valor, espera])
  return comEspera
}
