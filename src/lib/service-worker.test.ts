import { afterEach, describe, expect, it, vi } from 'vitest'
import { simularServiceWorker } from '@/test/service-worker'
import {
  guardarPaginaOffline,
  limparDadosOffline,
  quandoServiceWorkerAssumir,
  registrarServiceWorker,
} from './service-worker'

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

describe('guardarPaginaOffline e quandoServiceWorkerAssumir', () => {
  let desfazer = () => {}
  afterEach(() => desfazer())

  it('manda {tipo: "guardar-pagina", url} ao service worker ativo; sem ele, não faz nada', () => {
    expect(() => guardarPaginaOffline('/dashboard')).not.toThrow()
    const inativo = simularServiceWorker({ ativo: false })
    guardarPaginaOffline('/dashboard')
    expect(inativo.postMessage).not.toHaveBeenCalled()
    inativo.desfazer()

    const sw = simularServiceWorker()
    desfazer = sw.desfazer
    guardarPaginaOffline('https://poupamais.test/categorias')
    expect(sw.postMessage).toHaveBeenCalledWith({ tipo: 'guardar-pagina', url: 'https://poupamais.test/categorias' })
  })

  it('chama quando um service worker assume a página; não chama se já havia um, nem depois de cancelar', () => {
    const aoAtivar = vi.fn()
    const ativo = simularServiceWorker()
    quandoServiceWorkerAssumir(aoAtivar)()
    ativo.assumir()
    expect(aoAtivar).not.toHaveBeenCalled()
    ativo.desfazer()

    const sw = simularServiceWorker({ ativo: false })
    desfazer = sw.desfazer
    const cancelar = quandoServiceWorkerAssumir(aoAtivar)
    sw.assumir()
    expect(aoAtivar).toHaveBeenCalledOnce()

    const outro = vi.fn()
    const sw2 = simularServiceWorker({ ativo: false })
    desfazer = sw2.desfazer
    quandoServiceWorkerAssumir(outro)()
    sw2.assumir()
    expect(outro).not.toHaveBeenCalled()
    cancelar()
  })
})
