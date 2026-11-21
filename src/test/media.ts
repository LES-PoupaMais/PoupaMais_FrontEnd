import { vi } from 'vitest'

// O jsdom não tem matchMedia. `simularLargura(1280)` responde às consultas min-width/max-width como um navegador
// daquela largura (as outras consultas dão false) e avisa os ouvintes quando muda.
type Ouvinte = (evento: MediaQueryListEvent) => void
let largura = 390
const ouvintes = new Set<{ consulta: string; ouvinte: Ouvinte }>()

function casa(consulta: string) {
  const min = /min-width:\s*(\d+)px/.exec(consulta)
  const max = /max-width:\s*(\d+)px/.exec(consulta)
  // Consultas sem largura (prefers-reduced-motion, prefers-color-scheme…) respondem "não", como um navegador padrão
  if (!min && !max) return false
  return (!min || largura >= Number(min[1])) && (!max || largura <= Number(max[1]))
}

export function instalarMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({
      get matches() {
        return casa(consulta)
      },
      media: consulta,
      onchange: null,
      addEventListener: (_: string, ouvinte: Ouvinte) => ouvintes.add({ consulta, ouvinte }),
      removeEventListener: (_: string, ouvinte: Ouvinte) =>
        ouvintes.forEach((o) => o.ouvinte === ouvinte && ouvintes.delete(o)),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

export function simularLargura(nova: number) {
  largura = nova
  ouvintes.forEach(({ consulta, ouvinte }) =>
    ouvinte({ matches: casa(consulta), media: consulta } as MediaQueryListEvent),
  )
}
