import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { instalarMatchMedia, simularLargura } from './media'
import { server } from './msw/server'

// Requisição sem handler no MSW falha o teste: nada de chamada real à rede
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

// matchMedia falso (o jsdom não tem); cada teste começa na largura do celular (390px)
instalarMatchMedia()
beforeEach(() => simularLargura(390))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())

// O jsdom não tem ResizeObserver; o ResponsiveContainer do Recharts (átomo chart) usa. Os gráficos renderizam com a
// medida inicial do ChartContainer (320×200).
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
