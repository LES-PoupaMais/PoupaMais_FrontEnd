// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import vm from 'node:vm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Regras de cache do service worker do PWA (public/sw.js), testadas no próprio arquivo: ele roda aqui num contexto
// isolado do Node com `self`, `caches` e `fetch` falsos. CLAUDE.md, seção "PWA".

const ORIGEM = 'https://poupamais.test'
const codigo = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8')

type Requisicao = { method: string; url: string; mode: string; headers: Headers }
type Ouvinte = (evento: Record<string, unknown>) => void

function requisicao(caminho: string, { method = 'GET', mode = 'cors', headers = {} as Record<string, string> } = {}) {
  const url = caminho.startsWith('http') ? caminho : ORIGEM + caminho
  return { method, url, mode, headers: new Headers(headers) } satisfies Requisicao
}

const chave = (alvo: Requisicao | string) => (typeof alvo === 'string' ? new URL(alvo, ORIGEM).href : alvo.url)

class CachesFalsos {
  guardados = new Map<string, Map<string, Response>>()
  async open(nome: string) {
    if (!this.guardados.has(nome)) this.guardados.set(nome, new Map())
    const cache = this.guardados.get(nome)!
    return {
      put: async (alvo: Requisicao, resposta: Response) => void cache.set(chave(alvo), resposta),
      addAll: async (urls: string[]) => urls.forEach((url) => cache.set(chave(url), new Response(url))),
    }
  }
  async match(alvo: Requisicao, { cacheName }: { cacheName: string }) {
    return this.guardados.get(cacheName)?.get(chave(alvo))?.clone()
  }
  async delete(nome: string) {
    return this.guardados.delete(nome)
  }
  async keys() {
    return [...this.guardados.keys()]
  }
}

function carregarServiceWorker() {
  const ouvintes: Record<string, Ouvinte> = {}
  const caches = new CachesFalsos()
  const fetch = vi.fn<(alvo: Requisicao) => Promise<Response>>()
  const self = {
    location: { origin: ORIGEM },
    addEventListener: (tipo: string, ouvinte: Ouvinte) => void (ouvintes[tipo] = ouvinte),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  }
  const contexto = vm.createContext({ self, caches, fetch, Response, Headers, URL })
  const regras = vm.runInContext(`${codigo}\n;({ estrategia, podeGuardar, CACHES_ATUAIS })`, contexto) as {
    estrategia: (requisicao: Requisicao) => string | null
    podeGuardar: (resposta: Response) => boolean
    CACHES_ATUAIS: string[]
  }

  /** Dispara um `fetch` no service worker; devolve a resposta dele, ou `null` se ele não interceptar */
  async function buscar(alvo: Requisicao): Promise<Response | null> {
    let resposta: Promise<Response> | null = null
    ouvintes.fetch({ request: alvo, respondWith: (promessa: Promise<Response>) => (resposta = promessa) })
    return resposta
  }
  async function esperar(tipo: string, extra: Record<string, unknown> = {}) {
    let trabalho: Promise<unknown> = Promise.resolve()
    ouvintes[tipo]({ ...extra, waitUntil: (promessa: Promise<unknown>) => (trabalho = promessa) })
    await trabalho
  }
  const [CACHE_ESTATICO, CACHE_PAGINAS, CACHE_API] = regras.CACHES_ATUAIS
  return { ...regras, caches, fetch, self, buscar, esperar, CACHE_ESTATICO, CACHE_PAGINAS, CACHE_API }
}

const json = (corpo: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(corpo), { status: 200, ...init })

describe('public/sw.js', () => {
  let sw: ReturnType<typeof carregarServiceWorker>
  beforeEach(() => {
    sw = carregarServiceWorker()
  })

  it('escolhe a estratégia pela requisição', () => {
    const casos: [Requisicao, string | null][] = [
      [requisicao('/_next/static/chunks/app.js'), 'estatico'],
      [requisicao('/_next/static/media/plus-jakarta.woff2'), 'estatico'],
      [requisicao('/icons/icon-192.png'), 'estatico'],
      [requisicao('/manifest.webmanifest'), 'estatico'],
      [requisicao('/dashboard?mes=11&ano=2026', { mode: 'navigate' }), 'pagina'],
      [requisicao('/', { mode: 'navigate' }), 'pagina'],
      [requisicao('/api/lancamentos?mes=11&ano=2026'), 'api'],
      [requisicao('/api/usuarios/me/foto?v=1'), 'api'],
      // escrita e Server Actions: nunca
      [requisicao('/api/lancamentos', { method: 'POST' }), null],
      [requisicao('/api/lancamentos/1', { method: 'PUT' }), null],
      [requisicao('/api/lancamentos/1/status', { method: 'PATCH' }), null],
      [requisicao('/api/lancamentos/1', { method: 'DELETE' }), null],
      [requisicao('/perfil', { method: 'POST', headers: { 'Next-Action': 'abc' } }), null],
      [requisicao('/perfil', { headers: { 'Next-Action': 'abc' } }), null],
      // dados pessoais completos e rotas de acesso: nunca
      [requisicao('/api/usuarios/me/dados'), null],
      [requisicao('/api/auth/redefinir-senha'), null],
      [requisicao('/login?voltar=%2Fdashboard', { mode: 'navigate' }), null],
      [requisicao('/cadastro', { mode: 'navigate' }), null],
      [requisicao('/esqueci-senha', { mode: 'navigate' }), null],
      [requisicao('/redefinir-senha?token=segredo', { mode: 'navigate' }), null],
      // outra origem e requisições de dados do roteador (RSC) passam direto
      [requisicao('https://fonts.example.com/fonte.woff2'), null],
      [requisicao('/dashboard?_rsc=1', { headers: { RSC: '1' } }), null],
    ]
    for (const [alvo, esperado] of casos) expect(sw.estrategia(alvo), `${alvo.method} ${alvo.url}`).toBe(esperado)
  })

  it('só guarda respostas 200 da própria origem, sem redirecionamento e que não sejam download', () => {
    expect(sw.podeGuardar(json({}))).toBe(true)
    expect(sw.podeGuardar(json({}, { status: 404 }))).toBe(false)
    expect(sw.podeGuardar(json({}, { status: 500 }))).toBe(false)
    expect(sw.podeGuardar(new Response(null, { status: 204 }))).toBe(false)
    expect(sw.podeGuardar(json({}, { headers: { 'Content-Disposition': 'attachment; filename="x.csv"' } }))).toBe(false)
    expect(sw.podeGuardar(Object.defineProperty(json({}), 'redirected', { value: true }))).toBe(false)
    expect(sw.podeGuardar(Object.defineProperty(json({}), 'type', { value: 'opaque' }))).toBe(false)
  })

  it('GET de /api/*: network-first; sem internet, devolve a última resposta guardada', async () => {
    const alvo = requisicao('/api/dashboard?mes=11&ano=2026')
    sw.fetch.mockResolvedValueOnce(json({ saldo: 10 }))
    expect(await (await sw.buscar(alvo))!.json()).toEqual({ saldo: 10 })

    sw.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await (await sw.buscar(alvo))!.json()).toEqual({ saldo: 10 })
  })

  it('sem internet e sem cópia guardada, a falha de rede continua falha (a tela mostra "sem conexão")', async () => {
    sw.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect((await sw.buscar(requisicao('/api/categorias')))!.type).toBe('error')
  })

  it('não guarda erro nem download: sem internet não há o que devolver', async () => {
    const erro = requisicao('/api/lancamentos?mes=11&ano=2026')
    const download = requisicao('/api/lancamentos/exportar?formato=csv')
    sw.fetch.mockResolvedValueOnce(json({ mensagem: 'Erro' }, { status: 500 }))
    sw.fetch.mockResolvedValueOnce(new Response('a;b', { headers: { 'Content-Disposition': 'attachment' } }))
    expect((await sw.buscar(erro))!.status).toBe(500)
    expect((await sw.buscar(download))!.status).toBe(200)

    sw.fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    expect((await sw.buscar(erro))!.type).toBe('error')
    expect((await sw.buscar(download))!.type).toBe('error')
  })

  it('escrita, Server Actions, "Baixar meus dados" e rotas de acesso vão direto para a rede', async () => {
    expect(await sw.buscar(requisicao('/api/lancamentos', { method: 'POST' }))).toBeNull()
    expect(await sw.buscar(requisicao('/perfil', { method: 'POST', headers: { 'Next-Action': 'x' } }))).toBeNull()
    expect(await sw.buscar(requisicao('/api/usuarios/me/dados'))).toBeNull()
    expect(await sw.buscar(requisicao('/login', { mode: 'navigate' }))).toBeNull()
    expect(sw.fetch).not.toHaveBeenCalled()
  })

  it('arquivos fixos: cache-first (a segunda vez não vai à rede)', async () => {
    const alvo = requisicao('/_next/static/chunks/app.js')
    sw.fetch.mockResolvedValueOnce(new Response('codigo'))

    expect(await (await sw.buscar(alvo))!.text()).toBe('codigo')
    expect(await (await sw.buscar(alvo))!.text()).toBe('codigo')
    expect(sw.fetch).toHaveBeenCalledOnce()
  })

  it('páginas: network-first; sem internet, a última cópia', async () => {
    const alvo = requisicao('/dashboard', { mode: 'navigate' })
    sw.fetch.mockResolvedValueOnce(new Response('<html>v1</html>'))
    await sw.buscar(alvo)
    sw.fetch.mockResolvedValueOnce(new Response('<html>v2</html>'))
    expect(await (await sw.buscar(alvo))!.text()).toBe('<html>v2</html>')

    sw.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await (await sw.buscar(alvo))!.text()).toBe('<html>v2</html>')
  })

  it('{tipo: "limpar-dados"} apaga API e páginas, mantém os arquivos fixos e confirma pela porta', async () => {
    sw.fetch.mockResolvedValueOnce(json({ saldo: 10 }))
    await sw.buscar(requisicao('/api/dashboard'))
    sw.fetch.mockResolvedValueOnce(new Response('<html></html>'))
    await sw.buscar(requisicao('/dashboard', { mode: 'navigate' }))
    sw.fetch.mockResolvedValueOnce(new Response('codigo'))
    await sw.buscar(requisicao('/_next/static/app.js'))
    const porta = { postMessage: vi.fn() }

    await sw.esperar('message', { data: { tipo: 'limpar-dados' }, ports: [porta] })

    expect(await sw.caches.keys()).toEqual([sw.CACHE_ESTATICO])
    expect(porta.postMessage).toHaveBeenCalledWith({ tipo: 'dados-limpos' })
  })

  it('ignora outras mensagens', async () => {
    sw.fetch.mockResolvedValueOnce(json({ saldo: 10 }))
    await sw.buscar(requisicao('/api/dashboard'))

    await sw.esperar('message', { data: { tipo: 'outra' }, ports: [] })
    await sw.esperar('message', { data: null, ports: [] })

    expect(await sw.caches.keys()).toContain(sw.CACHE_API)
  })

  it('um 401 da API (sessão vencida) apaga os dados guardados', async () => {
    sw.fetch.mockResolvedValueOnce(json({ saldo: 10 }))
    await sw.buscar(requisicao('/api/dashboard'))
    sw.fetch.mockResolvedValueOnce(json({ mensagem: 'Sessão expirada' }, { status: 401 }))

    expect((await sw.buscar(requisicao('/api/lancamentos')))!.status).toBe(401)
    expect(await sw.caches.keys()).not.toContain(sw.CACHE_API)
  })

  it('install guarda o manifest e os ícones; activate apaga só os caches de versões antigas', async () => {
    await sw.esperar('install')
    expect([...sw.caches.guardados.get(sw.CACHE_ESTATICO)!.keys()]).toEqual([
      `${ORIGEM}/manifest.webmanifest`,
      `${ORIGEM}/icons/icon-192.png`,
      `${ORIGEM}/icons/icon-512.png`,
    ])
    expect(sw.self.skipWaiting).toHaveBeenCalled()

    await sw.caches.open('poupamais-api-v0')
    await sw.caches.open('outro-site')
    await sw.esperar('activate')

    expect(await sw.caches.keys()).toEqual([sw.CACHE_ESTATICO, 'outro-site'])
    expect(sw.self.clients.claim).toHaveBeenCalled()
  })
})
