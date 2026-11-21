import { afterEach, describe, expect, it, vi } from 'vitest'
import { simularServiceWorker } from '@/test/service-worker'
import { limparDadosOffline, registrarServiceWorker } from './service-worker'

describe('registrarServiceWorker', () => {
  let desfazer = () => {}
  afterEach(() => {
    desfazer()
    vi.unstubAllEnvs()
  })

  it('não registra fora do build de produção (dev e testes)', async () => {
    const sw = simularServiceWorker()
    desfazer = sw.desfazer

    vi.stubEnv('NODE_ENV', 'development')
    expect(await registrarServiceWorker()).toBeNull()
    vi.stubEnv('NODE_ENV', 'test')
    expect(await registrarServiceWorker()).toBeNull()
    expect(sw.register).not.toHaveBeenCalled()
  })

  it('em produção registra o /sw.js no escopo da aplicação inteira', async () => {
    const sw = simularServiceWorker()
    desfazer = sw.desfazer
    vi.stubEnv('NODE_ENV', 'production')

    expect(await registrarServiceWorker()).toEqual({ scope: '/' })
    expect(sw.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('em produção, sem suporte no navegador ou com falha no registro, segue sem service worker', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(await registrarServiceWorker()).toBeNull()

    const sw = simularServiceWorker()
    desfazer = sw.desfazer
    sw.register.mockRejectedValueOnce(new Error('SecurityError'))
    expect(await registrarServiceWorker()).toBeNull()
  })
})

describe('limparDadosOffline', () => {
  let desfazer = () => {}
  afterEach(() => {
    desfazer()
    vi.useRealTimers()
  })

  it('sem service worker, termina na hora', async () => {
    await expect(limparDadosOffline()).resolves.toBeUndefined()

    const sw = simularServiceWorker({ ativo: false })
    desfazer = sw.desfazer
    await expect(limparDadosOffline()).resolves.toBeUndefined()
  })

  it('manda {tipo: "limpar-dados"} na hora e termina quando o service worker confirma', async () => {
    const sw = simularServiceWorker()
    desfazer = sw.desfazer

    const pedido = limparDadosOffline()

    expect(sw.postMessage).toHaveBeenCalledOnce()
    expect(sw.postMessage).toHaveBeenCalledWith({ tipo: 'limpar-dados' }, [expect.any(MessagePort)])
    await expect(pedido).resolves.toBeUndefined()
  })

  it('sem confirmação, não prende quem chamou: termina no prazo', async () => {
    vi.useFakeTimers()
    const sw = simularServiceWorker({ responde: false })
    desfazer = sw.desfazer

    const pedido = limparDadosOffline(500)
    vi.advanceTimersByTime(500)

    await expect(pedido).resolves.toBeUndefined()
  })
})
