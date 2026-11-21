import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { simularServiceWorker } from '@/test/service-worker'
import { RegistroServiceWorker } from './RegistroServiceWorker'

describe('RegistroServiceWorker', () => {
  let desfazer = () => {}
  afterEach(() => {
    desfazer()
    vi.unstubAllEnvs()
  })

  it('nos testes (fora da produção) não registra e não desenha nada', () => {
    const sw = simularServiceWorker()
    desfazer = sw.desfazer

    const { container } = render(<RegistroServiceWorker />)

    expect(container).toBeEmptyDOMElement()
    expect(sw.register).not.toHaveBeenCalled()
  })

  it('no build de produção registra o /sw.js ao montar', async () => {
    const sw = simularServiceWorker()
    desfazer = sw.desfazer
    vi.stubEnv('NODE_ENV', 'production')

    render(<RegistroServiceWorker />)

    await vi.waitFor(() => expect(sw.register).toHaveBeenCalledWith('/sw.js', { scope: '/' }))
  })
})
