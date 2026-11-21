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
  async match(alvo: Requisicao, { cacheName, ignoreSearch = false }: { cacheName: string; ignoreSearch?: boolean }) {
    const cache = this.guardados.get(cacheName)
    if (!ignoreSearch) return cache?.get(chave(alvo))?.clone()
    const semQuery = (url: string) => url.split('?')[0]
    const achada = [...(cache ?? [])].find(([url]) => semQuery(url) === semQuery(chave(alvo)))
    return achada?.[1].clone()
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
  const contexto = vm.createContext({ self, caches, fetch, Request, Response, Headers, URL })
  const regras = vm.runInContext(`${codigo}\n;({ estrategia, podeGuardar, CACHES_ATUAIS })`, contexto) as {
    estrategia: (requisicao: Requisicao) => string | null
    podeGuardar: (resposta: Response) => boolean
    CACHES_ATUAIS: string[]
  }

  /** Dispara um `fetch` no service worker; devolve a resposta dele, ou `null` se ele não interceptar */
  async function buscar(alvo: Requisicao): Promise<Response | null> {
    let resposta: Promise<Response> | null = null
    ouvintes.fetch({
      request: alvo,
      respondWith: (promessa: Promise<Response>) => (resposta = promessa),
      waitUntil: () => {},
    })
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
const html = (corpo: string, init: ResponseInit = {}) =>
  new Response(corpo, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, ...init })

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

  it('resposta que chega depois do "limpar-dados" não é guardada (pedido feito antes do Sair)', async () => {
    let entregar: (resposta: Response) => void = () => {}
    sw.fetch.mockReturnValueOnce(new Promise<Response>((ok) => (entregar = ok)))
    const emAndamento = sw.buscar(requisicao('/api/dashboard?mes=11&ano=2026'))

    await sw.esperar('message', { data: { tipo: 'limpar-dados' }, ports: [] })
    entregar(json({ saldo: 10 }))

    expect(await (await emAndamento)!.json()).toEqual({ saldo: 10 }) // a tela ainda recebe a resposta
    expect(await sw.caches.keys()).not.toContain(sw.CACHE_API) // mas nada fica no aparelho

    sw.fetch.mockResolvedValueOnce(json({ saldo: 20 }))
    await sw.buscar(requisicao('/api/dashboard?mes=11&ano=2026'))
    expect(await sw.caches.keys()).toContain(sw.CACHE_API) // pedidos feitos depois da limpeza voltam a ser guardados
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

  describe('telas abertas por link interno ({tipo: "guardar-pagina"} do app)', () => {
    const guardarPagina = (url: string) => sw.esperar('message', { data: { tipo: 'guardar-pagina', url }, ports: [] })

    it('busca em segundo plano o HTML completo da tela e guarda no cache de páginas; offline, ele abre', async () => {
      sw.fetch.mockResolvedValueOnce(html('<html>lancamentos</html>'))

      await guardarPagina(`${ORIGEM}/lancamentos?mes=11&ano=2026`)

      // pede a página completa, mesma origem, com o cookie
      const pedido = sw.fetch.mock.calls[0][0] as unknown as Request
      expect(pedido.url).toBe(`${ORIGEM}/lancamentos?mes=11&ano=2026`)
      expect(pedido.credentials).toBe('same-origin')
      expect(pedido.headers.get('Accept')).toBe('text/html')

      // sem internet, o Next faz a navegação completa e o service worker devolve a cópia
      sw.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      const offline = await sw.buscar(requisicao('/lancamentos?mes=11&ano=2026', { mode: 'navigate' }))
      expect(await offline!.text()).toBe('<html>lancamentos</html>')
    })

    it('vale para todas as telas da área logada, inclusive subtelas; tira o _rsc e o #', async () => {
      for (const caminho of [
        '/dashboard?_rsc=abc',
        '/lancamentos/7#topo',
        '/lancamentos/novo',
        '/categorias',
        '/perfil',
      ]) {
        sw.fetch.mockResolvedValueOnce(html(`<html>${caminho}</html>`))
        await guardarPagina(caminho)
      }
      expect([...sw.caches.guardados.get(sw.CACHE_PAGINAS)!.keys()]).toEqual([
        `${ORIGEM}/dashboard`,
        `${ORIGEM}/lancamentos/7`,
        `${ORIGEM}/lancamentos/novo`,
        `${ORIGEM}/categorias`,
        `${ORIGEM}/perfil`,
      ])
    })

    it('ignora rotas fora da área logada, rotas de acesso, outra origem e endereço inválido', async () => {
      for (const url of [
        '/',
        '/privacidade',
        '/login?voltar=%2Fdashboard',
        '/dashboardx',
        'https://outro.example.com/dashboard',
        'http://[',
      ]) {
        await guardarPagina(url)
      }
      expect(sw.fetch).not.toHaveBeenCalled()
    })

    it('a navegação do Next (RSC) e o prefetch continuam indo direto para a rede, sem cache', async () => {
      expect(await sw.buscar(requisicao('/dashboard?_rsc=1', { headers: { RSC: '1' } }))).toBeNull()
      expect(
        await sw.buscar(requisicao('/dashboard?_rsc=2', { headers: { RSC: '1', 'Next-Router-Prefetch': '1' } })),
      ).toBeNull()
      expect(sw.fetch).not.toHaveBeenCalled()
    })

    it('não guarda redirecionamento (sessão sem cookie → /login), erro nem resposta que não é HTML', async () => {
      const redirecionada = Object.defineProperty(html('<html>login</html>'), 'redirected', { value: true })
      sw.fetch.mockResolvedValueOnce(redirecionada)
      sw.fetch.mockResolvedValueOnce(html('<html>404</html>', { status: 404 }))
      sw.fetch.mockResolvedValueOnce(new Response('0:{}', { headers: { 'Content-Type': 'text/x-component' } }))

      await guardarPagina('/dashboard')
      await guardarPagina('/lancamentos/999')
      await guardarPagina('/categorias')

      expect(sw.caches.guardados.get(sw.CACHE_PAGINAS)?.size ?? 0).toBe(0)
    })

    it('sem internet, a busca em segundo plano falha em silêncio e a cópia anterior fica', async () => {
      sw.fetch.mockResolvedValueOnce(html('<html>v1</html>'))
      await guardarPagina('/perfil')
      sw.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(guardarPagina('/perfil')).resolves.toBeUndefined()

      sw.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      expect(await (await sw.buscar(requisicao('/perfil', { mode: 'navigate' })))!.text()).toBe('<html>v1</html>')
    })

    it('não guarda a página que chega depois do "limpar-dados" (pedido feito antes do Sair)', async () => {
      let entregar: (resposta: Response) => void = () => {}
      sw.fetch.mockReturnValueOnce(new Promise<Response>((ok) => (entregar = ok)))
      const emAndamento = guardarPagina('/dashboard')

      await sw.esperar('message', { data: { tipo: 'limpar-dados' }, ports: [] })
      entregar(html('<html>dados de quem saiu</html>'))
      await emAndamento

      expect(await sw.caches.keys()).not.toContain(sw.CACHE_PAGINAS)
    })

    it('não busca de novo o mesmo endereço enquanto a busca anterior não termina', async () => {
      let entregar: (resposta: Response) => void = () => {}
      sw.fetch.mockReturnValueOnce(new Promise<Response>((ok) => (entregar = ok)))
      const primeira = guardarPagina('/categorias')
      const segunda = guardarPagina('/categorias')
      entregar(html('<html>categorias</html>'))
      await Promise.all([primeira, segunda])

      expect(sw.fetch).toHaveBeenCalledOnce()
    })
  })

  it('páginas offline: sem a cópia do endereço exato, abre a da mesma tela com outra query; API não', async () => {
    sw.fetch.mockResolvedValueOnce(html('<html>outubro</html>'))
    await sw.buscar(requisicao('/lancamentos?mes=10&ano=2026', { mode: 'navigate' }))
    sw.fetch.mockResolvedValueOnce(json({ saldo: 10 }))
    await sw.buscar(requisicao('/api/dashboard?mes=10&ano=2026'))
    sw.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const pagina = await sw.buscar(requisicao('/lancamentos?mes=11&ano=2026', { mode: 'navigate' }))
    expect(await pagina!.text()).toBe('<html>outubro</html>')
    expect((await sw.buscar(requisicao('/lancamentos/novo', { mode: 'navigate' })))!.type).toBe('error')
    // na API, outra query é outro dado: sem cópia exata, continua "sem conexão"
    expect((await sw.buscar(requisicao('/api/dashboard?mes=11&ano=2026')))!.type).toBe('error')
  })
})
