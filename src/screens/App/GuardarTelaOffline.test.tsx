import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { simularServiceWorker } from '@/test/service-worker'
import { GuardarTelaOffline } from './GuardarTelaOffline'

const navegacao = vi.hoisted(() => ({ caminho: '/dashboard', busca: 'mes=11&ano=2026' }))
vi.mock('next/navigation', () => ({
  usePathname: () => navegacao.caminho,
  useSearchParams: () => new URLSearchParams(navegacao.busca),
}))

const mensagem = (url: string) => [{ tipo: 'guardar-pagina', url }]

describe('GuardarTelaOffline', () => {
  let desfazer = () => {}
  beforeEach(() => {
    navegacao.caminho = '/dashboard'
    navegacao.busca = 'mes=11&ano=2026'
  })
  afterEach(() => desfazer())

  it('página carregada inteira com o service worker ativo: não pede nada (ele já guardou); a cada troca de tela, pede', () => {
    const sw = simularServiceWorker()
    desfazer = sw.desfazer

    const { container, rerender } = render(<GuardarTelaOffline />)
    expect(container).toBeEmptyDOMElement()
    expect(sw.postMessage).not.toHaveBeenCalled()

    navegacao.caminho = '/categorias'
    navegacao.busca = ''
    window.history.replaceState(null, '', '/categorias')
    rerender(<GuardarTelaOffline />)
    expect(sw.postMessage).toHaveBeenLastCalledWith(...mensagem(`${window.location.origin}/categorias`))

    // só a query mudou (outro mês): também pede
    navegacao.busca = 'mes=10&ano=2026'
    window.history.replaceState(null, '', '/categorias?mes=10&ano=2026')
    rerender(<GuardarTelaOffline />)
    expect(sw.postMessage).toHaveBeenLastCalledWith(...mensagem(`${window.location.origin}/categorias?mes=10&ano=2026`))

    // nada mudou: não pede de novo
    rerender(<GuardarTelaOffline />)
    expect(sw.postMessage).toHaveBeenCalledTimes(2)
  })

  it('primeira visita (sem service worker controlando): pede quando ele assumir', () => {
    const sw = simularServiceWorker({ ativo: false })
    desfazer = sw.desfazer
    window.history.replaceState(null, '', '/dashboard?mes=11&ano=2026')

    render(<GuardarTelaOffline />)
    expect(sw.postMessage).not.toHaveBeenCalled()

    sw.assumir()
    expect(sw.postMessage).toHaveBeenCalledWith(...mensagem(`${window.location.origin}/dashboard?mes=11&ano=2026`))
  })

  it('sem suporte a service worker, não quebra', () => {
    expect(() => render(<GuardarTelaOffline />)).not.toThrow()
  })
})
