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
