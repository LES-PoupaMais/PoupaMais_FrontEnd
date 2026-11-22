# PWA (instalar como app no celular)

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## PWA (instalar como app no celular)

O PoupaMais instala como app (tela inicial do celular, janela própria sem barra do navegador). Peças:

- **Manifest:** `src/app/manifest.ts` (o Next serve em `/manifest.webmanifest`): nome "PoupaMais", abre em `/dashboard`,
  `display: standalone`, cores do DS (`fundo` claro `#F4F6F8` e `primaria` `#2B68D6`) e os ícones de `public/icons/`
  (`icon-192.png`, `icon-512.png` e `icon-maskable-512.png`, o porquinho a 70% sobre branco, para o recorte do Android).
  `app/icon.png`, `app/apple-icon.png` (ícone do iPhone) e `app/favicon.ico` continuam como estavam.
- **Metas** (`app/layout.tsx`): `applicationName`, `appleWebApp` (instalar pelo Safari) e `viewport.themeColor` com o `fundo` de
  cada tema (claro `#F4F6F8`, escuro `#111A2F`).
- **Service worker:** `public/sw.js`, escrito à mão (sem bibliotecas), com a constante `VERSAO` (suba-a ao mudar regras ou
  arquivos: o `activate` apaga os caches antigos). O `next.config.ts` serve o `/sw.js` com `Cache-Control: no-cache`.
  - Arquivos fixos (`/_next/static/*`: JS, CSS e fontes; `/icons/`, `/logos/`, manifest e ícones): **cache-first**.
  - Páginas (navegação): **network-first**; sem internet, a última cópia guardada (o app abre offline). Sem a cópia do
    endereço exato, vale a da mesma tela com outra query (`ignoreSearch`: `/lancamentos?mes=11&ano=2026` abre a cópia de
    `/lancamentos?mes=10&ano=2026`; a tela lê o mês da URL e mostra os dados guardados desse mês ou o "sem conexão"). Só nas
    páginas: na API, outra query é outro dado.
  - **Telas abertas por link interno** (desde 21/11, `VERSAO` `v3`): a navegação do cliente do Next não carrega a página
    inteira (só RSC), então o service worker não via a página passar e ela não abria offline. Agora
    `screens/App/GuardarTelaOffline` (no `AppProviders`, dentro de um `<Suspense>` porque lê `useSearchParams`) manda
    `{tipo: 'guardar-pagina', url}` (`lib/service-worker.guardarPaginaOffline`) a cada troca de caminho ou de query; o
    service worker aceita só endereço da própria origem e da área logada (as rotas do `proxy.ts`: `/dashboard`,
    `/lancamentos/**`, `/categorias`, `/perfil`), busca em segundo plano o HTML completo (sem `_rsc` nem `#`, mesma
    origem, com o cookie) e guarda no cache de páginas com as mesmas regras (só 200 de HTML, sem redirecionamento, que é o
    caso da sessão sem cookie indo para o `/login`, e a regra da `geracao`). Um mesmo endereço não é buscado duas vezes ao
    mesmo tempo. Na página carregada inteira não há pedido (a navegação já passou pelo service worker), salvo na primeira
    visita, quando ele ainda não controlava a página: o pedido sai no `controllerchange`. Sem internet, o RSC falha, o Next
    faz a navegação completa ("Falling back to browser navigation") e o service worker devolve a cópia.
    **Por que não pelo RSC no service worker** (a primeira ideia: ver a requisição `RSC: 1` sem `Next-Router-Prefetch` e
    buscar a página): conferido no navegador com o build de produção, com `cacheComponents` + `partialPrefetching` o Next
    16 faz o prefetch completo da tela (`Next-Router-Prefetch: 3`) e navega **sem** nenhuma requisição RSC de navegação, então
    o service worker nunca a via; tratar o prefetch buscaria a página de todo link visível. Custo aceito: cada troca de tela
    com internet gera um pedido a mais da página (inclusive mudar mês ou busca, que mudam a query).
  - `GET /api/*`: **network-first**; sem internet, a última resposta guardada (consulta só de leitura). As consultas do
    TanStack Query usam `networkMode: 'offlineFirst'` (`AppProviders`) para tentar mesmo offline e receber essa cópia; a tela
    mostra os dados guardados e a faixa "Sem internet agora…", e os botões que gravam continuam desabilitados.
  - **Fora do cache:** POST/PUT/PATCH/DELETE e Server Actions (header `Next-Action`); as requisições RSC e o
    prefetch do Next (só a página completa é guardada); respostas que não são 200,
    redirecionamentos e downloads (`Content-Disposition: attachment`: exportar, modelo CSV); `/api/usuarios/me/dados`; as
    rotas de acesso (`/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` e `/api/auth/*`); outras origens.
  - **Limpeza:** "Sair" (casca e Perfil), sessão vencida (401 no `AppProviders`) e conta excluída mandam
    `{tipo: 'limpar-dados'}` (`lib/service-worker.limparDadosOffline`), que apaga as respostas da API e as páginas guardadas;
    qualquer 401 de `/api/*` também limpa no próprio service worker. Nada de uma pessoa fica no aparelho para a próxima.
    Cada limpeza sobe a `geracao` do service worker: resposta de um pedido feito **antes** da limpeza e que chega **depois**
    (ex.: as consultas que o app refaz quando a internet volta, se a pessoa sai logo em seguida) vai para a tela, mas não é
    guardada (achado no ensaio do deploy, 21/11; `VERSAO` passou a `v2`).
- **Registro:** `screens/App/RegistroServiceWorker` (no `AppProviders`) chama `lib/service-worker.registrarServiceWorker`, que só
  registra com `NODE_ENV=production` e `'serviceWorker' in navigator`. No `npm run dev` não há service worker.
- **Onde instala:** só em **HTTPS** ou em `localhost`. Pelo IP da rede (`http://192.168.x.x:3000`) o navegador não registra o
  service worker nem oferece instalar. Para testar no celular: o modo "como produção" do PoupaMais_Development
  (`https://poupamais.localhost:8443`) ou o site publicado (https://poupamais-one.vercel.app).
- **Como testar:** `npm run build && npm run start`, abrir `http://localhost:3000` no Chrome → DevTools > **Application**
  (Manifest: nome, ícones e "Installable"; Service workers: ativo; Cache storage: `poupamais-*`; marque "Offline" e recarregue
  uma tela já visitada) e **Lighthouse** (categoria PWA / "Installable"). No celular (Chrome Android): menu ⋮ > "Instalar app";
  no iPhone (Safari): Compartilhar > "Adicionar à Tela de Início".
- **Testes:** `src/test/sw.test.ts` roda o próprio `public/sw.js` num contexto isolado do Node (estratégias, o que não entra no
  cache, limpeza, 401, install/activate, `guardar-pagina` e a cópia da mesma tela com outra query);
  `GuardarTelaOffline.test.tsx` (pede a cada troca de tela, não na página carregada inteira, e na primeira visita quando o
  service worker assume); `lib/service-worker.test.ts` e `RegistroServiceWorker.test.tsx` (registra só em produção,
  manda `limpar-dados`); `e2e/pwa.spec.ts` no build de produção (manifest e ícones respondem, SW registra). Os outros E2E rodam com
  `serviceWorkers: 'block'` (`playwright.config.ts`), porque o service worker passaria na frente do `page.route('**/api/**')`.
