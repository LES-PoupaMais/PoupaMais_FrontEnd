/*
 * PoupaMais: service worker do PWA (escrito à mão, sem bibliotecas). Registrado só no build de produção
 * (screens/App/RegistroServiceWorker → lib/service-worker). Regras no CLAUDE.md, seção "PWA".
 *
 * - Arquivos fixos (/_next/static/*: JS, CSS e fontes; ícones, logos, manifest): cache-first.
 * - Páginas (navegação): network-first; sem internet, a última cópia guardada (se não houver a do endereço exato, a
 *   da mesma tela com outra query, ex.: outro ?mes=).
 * - Telas da área logada abertas por link interno (navegação do cliente do Next, sem carregar a página inteira): o app
 *   manda {tipo: 'guardar-pagina', url} a cada troca de tela (screens/App/GuardarTelaOffline) e o service worker busca
 *   em segundo plano o HTML completo dela e guarda no cache de páginas, com as mesmas regras. Sem internet, o Next cai
 *   para a navegação completa quando o RSC falha, e a cópia guardada abre.
 * - GET de /api/*: network-first; sem internet, a última resposta guardada (consulta só de leitura).
 * - Nunca entram no cache: POST/PUT/PATCH/DELETE e Server Actions (header Next-Action), respostas que não são 200,
 *   redirecionamentos, downloads (Content-Disposition: attachment), /api/usuarios/me/dados e as rotas de acesso.
 * - Mensagem {tipo: 'limpar-dados'} (logout, sessão vencida, conta excluída) e qualquer 401 da API apagam os dados
 *   guardados (API e páginas), para não sobrar dado de outra pessoa no aparelho. Resposta que chega depois de uma
 *   limpeza (pedido feito antes dela) não é guardada.
 *
 * Mudou alguma regra ou a lista de arquivos? Suba a VERSAO: o activate apaga os caches das versões antigas.
 */

const VERSAO = 'v3'
const CACHE_ESTATICO = 'poupamais-estatico-' + VERSAO
const CACHE_PAGINAS = 'poupamais-paginas-' + VERSAO
const CACHE_API = 'poupamais-api-' + VERSAO
const CACHES_ATUAIS = [CACHE_ESTATICO, CACHE_PAGINAS, CACHE_API]

const PREFIXOS_ESTATICOS = ['/_next/static/', '/icons/', '/logos/']
const ARQUIVOS_ESTATICOS = ['/manifest.webmanifest', '/favicon.ico', '/icon.png', '/apple-icon.png']
const PRE_CACHE = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']
const ROTAS_DE_ACESSO = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha', '/api/auth']
const API_FORA_DO_CACHE = ['/api/usuarios/me/dados']
// Mesmas rotas que o src/proxy.ts protege
const ROTAS_DA_AREA_LOGADA = ['/dashboard', '/lancamentos', '/categorias', '/perfil']

function comecaCom(caminho, rota) {
  return caminho === rota || caminho.startsWith(rota + '/')
}

/** 'estatico' | 'pagina' | 'api' | null (null = o service worker não mexe: vai direto para a rede) */
function estrategia(requisicao) {
  if (requisicao.method !== 'GET' || requisicao.headers.has('next-action')) return null
  const url = new URL(requisicao.url)
  if (url.origin !== self.location.origin) return null
  const caminho = url.pathname
  if (ROTAS_DE_ACESSO.some((rota) => comecaCom(caminho, rota))) return null
  if (caminho.startsWith('/api/')) return API_FORA_DO_CACHE.some((rota) => comecaCom(caminho, rota)) ? null : 'api'
  if (PREFIXOS_ESTATICOS.some((prefixo) => caminho.startsWith(prefixo)) || ARQUIVOS_ESTATICOS.includes(caminho)) {
    return 'estatico'
  }
  if (requisicao.mode === 'navigate') return 'pagina'
  return null
}

/**
 * Endereço da tela que o app pediu para guardar ({tipo: 'guardar-pagina', url}): só da própria origem e da área logada.
 * Devolve o endereço da página completa (sem `_rsc` nem `#`, como o Next pede na navegação completa) ou null.
 */
function paginaParaGuardar(endereco) {
  let url
  try {
    url = new URL(endereco, self.location.origin)
  } catch {
    return null
  }
  if (url.origin !== self.location.origin) return null
  if (!ROTAS_DA_AREA_LOGADA.some((rota) => comecaCom(url.pathname, rota))) return null
  url.searchParams.delete('_rsc')
  url.hash = ''
  return url.href
}

/** Só respostas 200 da própria origem, sem redirecionamento e que não sejam download */
function podeGuardar(resposta) {
  if (!resposta || resposta.status !== 200 || resposta.redirected) return false
  if (resposta.type !== 'basic' && resposta.type !== 'default') return false
  const disposicao = resposta.headers.get('content-disposition') || ''
  return !/attachment/i.test(disposicao)
}

async function guardar(nomeCache, requisicao, resposta) {
  if (!podeGuardar(resposta)) return
  const cache = await caches.open(nomeCache)
  await cache.put(requisicao, resposta.clone())
}

/**
 * Sobe a cada limpeza. Uma resposta só é guardada se a limpeza não aconteceu enquanto ela vinha da rede: sem isso, uma
 * consulta que saiu antes do "Sair" (ex.: as que o app refaz quando a internet volta) e chegou depois gravaria de novo
 * os dados da pessoa no aparelho.
 */
let geracao = 0

function limparDados() {
  geracao += 1
  return Promise.all([caches.delete(CACHE_API), caches.delete(CACHE_PAGINAS)])
}

async function cacheFirst(requisicao) {
  const guardada = await caches.match(requisicao, { cacheName: CACHE_ESTATICO })
  if (guardada) return guardada
  const resposta = await fetch(requisicao)
  await guardar(CACHE_ESTATICO, requisicao, resposta)
  return resposta
}

/** A cópia do endereço exato; nas páginas, se não houver, a da mesma tela com outra query (ex.: outro ?mes=&ano=) */
async function copiaGuardada(requisicao, nomeCache) {
  const exata = await caches.match(requisicao, { cacheName: nomeCache })
  if (exata || nomeCache !== CACHE_PAGINAS) return exata
  return caches.match(requisicao, { cacheName: nomeCache, ignoreSearch: true })
}

async function networkFirst(requisicao, nomeCache) {
  const geracaoDoPedido = geracao
  let resposta
  try {
    resposta = await fetch(requisicao)
  } catch {
    return (await copiaGuardada(requisicao, nomeCache)) || Response.error()
  }
  if (nomeCache === CACHE_API && resposta.status === 401) await limparDados()
  else if (geracaoDoPedido === geracao) await guardar(nomeCache, requisicao, resposta)
  return resposta
}

// Endereços com uma busca em segundo plano em andamento (o mesmo endereço não é buscado duas vezes ao mesmo tempo)
const paginasEmBusca = new Set()

/**
 * Busca o HTML completo de uma tela aberta por link interno e guarda no cache de páginas, com as regras de sempre
 * (`podeGuardar`: sem redirecionamento, como o do proxy para o /login, e só 200; e a `geracao`: nada de guardar se
 * houve limpeza enquanto a resposta vinha). Sem internet, não faz nada: fica a cópia anterior.
 */
async function guardarPaginaEmSegundoPlano(endereco) {
  if (paginasEmBusca.has(endereco)) return
  paginasEmBusca.add(endereco)
  const geracaoDoPedido = geracao
  try {
    const requisicao = new Request(endereco, { credentials: 'same-origin', headers: { Accept: 'text/html' } })
    const resposta = await fetch(requisicao)
    const ehHtml = (resposta.headers.get('content-type') || '').includes('text/html')
    if (ehHtml && geracaoDoPedido === geracao) await guardar(CACHE_PAGINAS, requisicao, resposta)
  } catch {
    // sem internet: fica a cópia anterior
  } finally {
    paginasEmBusca.delete(endereco)
  }
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_ESTATICO)
      .then((cache) => cache.addAll(PRE_CACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => nome.startsWith('poupamais-') && !CACHES_ATUAIS.includes(nome))
            .map((nome) => caches.delete(nome)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const tipo = estrategia(evento.request)
  if (tipo === 'estatico') evento.respondWith(cacheFirst(evento.request))
  else if (tipo === 'pagina') evento.respondWith(networkFirst(evento.request, CACHE_PAGINAS))
  else if (tipo === 'api') evento.respondWith(networkFirst(evento.request, CACHE_API))
})

self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.tipo === 'guardar-pagina') {
    const pagina = paginaParaGuardar(String(evento.data.url))
    if (pagina) evento.waitUntil(guardarPaginaEmSegundoPlano(pagina))
    return
  }
  if (!evento.data || evento.data.tipo !== 'limpar-dados') return
  const porta = evento.ports && evento.ports[0]
  evento.waitUntil(
    limparDados().then(() => {
      if (porta) porta.postMessage({ tipo: 'dados-limpos' })
    }),
  )
})
