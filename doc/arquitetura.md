# Arquitetura e stack do front

> Detalhe do guia (antes no `CLAUDE.md`). Índice no `AGENTS.md`.

## Stack

| Item          | Escolha |
| ------------- | ------- |
| Framework     | **Next.js 16 (App Router) + React 19 + TypeScript** (`src/`, alias `@/*`). `cacheComponents` ligado (ver Arquitetura) |
| Estilo        | Tailwind CSS 4 + **shadcn/ui** (átomos em `components/atoms`, tema em variáveis CSS) + `cn()` (`@/lib/cn`, pacote `cn` do shadcn, configurado com os tokens próprios) + `class-variance-authority` |
| Tema          | `next-themes` (`attribute="class"`, padrão = sistema; troca Sistema/Claro/Escuro no Perfil) |
| Primitivos acessíveis | Radix UI (pacote `radix-ui`), por baixo dos átomos do shadcn (RNF012) |
| Dados remotos | TanStack Query: cache de 5 min (`staleTime`) e 10 min na memória (`gcTime`), em `screens/App/AppProviders` (repetir um filtro ou voltar a uma tela não busca de novo; o foco na janela só recarrega o que venceu). Lista com `useInfiniteQuery` e `keepPreviousData` (a lista anterior fica na tela enquanto a nova carrega). Depois de cada mutação, as consultas afetadas recarregam pelo mapa de `lib/invalidacoes.ts` (`invalidarApos(queryClient, 'lancamentoSalvo')`), nunca com `invalidateQueries` solto nos hooks; login e logout fazem `queryClient.clear()`. Risco aceito: mudança feita em outro aparelho aparece em até 5 min (ou ao recarregar) |
| HTTP          | `fetch` via `lib/http` apontando para o **BFF** do próprio Next (`/api/*`) |
| Formulários   | React Hook Form + Zod (`@hookform/resolvers`) |
| Gráficos      | Recharts pelo átomo `chart` do shadcn: **área** (Receitas × Despesas) e **barras** (saldo mensal, categorias). **Nunca pizza nem rosca** |
| Ícones        | lucide-react (traço 1,75–2px; 16, 20, 24) |
| Toasts        | sonner (átomo `sonner`, segue o tema) |
| Fonte         | `next/font/google`: **Plus Jakarta Sans** (500–800, `--font-plus-jakarta`), em `src/styles/fonts.ts` |
| Qualidade     | ESLint (config do Next) + **eslint-plugin-boundaries** (regras da Arquitetura) + Prettier + `prettier-plugin-tailwindcss` |
| Testes        | **Vitest** + Testing Library + `user-event` + **MSW** (cobertura v8) · **Playwright** (end-to-end, Chromium e Firefox) |

**Node:** nvm com Node 26 LTS. O repo tem `.nvmrc` (`26`): rode `nvm use` ao entrar na pasta (o Node 18 do sistema não serve).

## Arquitetura

### Árvore

```text
src/
├── app/                     # SÓ ROTAS: page.tsx/layout.tsx mínimos (Provider + View). Sem estado, regra ou estilo.
│   ├── layout.tsx           #   <html>, fonte, globals.css e <AppProviders> (screens/App)
│   ├── (public)/page.tsx    #   / → screens/Landing
│   ├── (auth)/login, cadastro/page.tsx
│   ├── (app)/layout.tsx     #   área logada: <Suspense> + <AppShell> (screens/AppShell → AppShellTemplate)
│   ├── (app)/dashboard/page.tsx
│   └── api/[...path]/route.ts   # BFF (repasse para a API com o token do cookie)
├── screens/                 # UMA PASTA POR TELA: estado, dados e composição (PascalCase)
│   ├── App/                 #   AppProviders: tema + QueryClient + tooltips + toasts (só o layout raiz usa)
│   ├── AppShell/            #   casca da área logada: AppShell (servidor, lê o cookie), Context, View, Skeleton
│   └── Dashboard/
│       ├── DashboardContext.tsx     # 'use client': hooks de dados, estado da tela, ações, toasts, useDashboardContext()
│       ├── DashboardView.tsx        # 'use client': consome o Context e preenche o Template com Organisms
│       ├── DashboardSkeleton.tsx    # fallback do <Suspense> da rota
│       ├── useDashboard*.ts         # (opcional) lógica isolada da tela
│       ├── DashboardView.test.tsx   # integração da tela (Provider + View + MSW)
│       └── index.ts                 # export público: DashboardProvider, DashboardView, DashboardSkeleton
├── components/              # UI PURA (Atomic Design): só props/children, sem rota, sem Context de tela, sem dados
│   ├── atoms/  molecules/  organisms/  templates/
├── hooks/                   # hooks GLOBAIS: TanStack Query (useLancamentos, useDashboard…), useMediaQuery
├── services/                # chamadas ao BFF /api/* (funções puras, sem React)
├── actions/                 # Server Actions (login, cadastro, logout, troca de senha, excluir conta)
├── schemas/                 # Zod (RN001, RN002, RN011…)
├── types/                   # api.ts: DTOs do contrato
├── constants/               # query-keys, rotas, navegação
├── lib/                     # http, format, data, periodo, destino, cn, session (server-only), cookies
├── styles/                  # globals.css (tokens do Design System) e fonts.ts
├── test/                    # setup, utils (renderComProviders, criarWrapper), media (matchMedia falso), msw/
└── proxy.ts                 # Next 16: substitui o middleware.ts
```

Na raiz: `components.json` (shadcn), `vitest.config.mts`, `playwright.config.ts`, `e2e/` (specs + `fixtures/`), `eslint.config.mjs`.

### Regras obrigatórias

1. **`app/`** só importa `screens/` (e `types/`; o layout raiz também importa `styles/`).
   - `page.tsx` envolve a tela no Provider e renderiza a View. Nada de `useState`/`useEffect`, `className` ou regra.
   - No Next 16, `params`/`searchParams` são **Promises**, e com `cacheComponents` ligado quem os lê fica dentro de `<Suspense>`.
     A página repassa a Promise para um componente interno que faz o `await` (exemplo na skill `tela-next`); o fallback é o
     `XxxSkeleton` exportado pela própria tela. Se o Context lê a URL com `useSearchParams`, a página só põe o `<Suspense>` em volta.
   - **Route groups:** em `(app)` o layout do grupo monta a casca (`screens/AppShell` → `AppShellTemplate`), porque ela persiste entre as
     telas. Em `(auth)` e `(public)` **não há layout de grupo**: o template (`AuthTemplate`, `PublicTemplate`) é escolhido pela View da
     tela, porque recebe título e subtítulo de cada tela.
   - `app/api/[...path]/route.ts` (BFF) é a única exceção: route handler sem UI, pode importar `lib/`, `types/` e `constants/`.
2. **`screens/`**:
   - O `Context` centraliza os dados (hooks globais de TanStack Query), o estado da tela (filtros, painel aberto, diálogo), as ações
     (mutations e Server Actions), a invalidação e os toasts. `useXxxContext()` dá erro claro fora do Provider.
   - O **filtro de mês fica na URL** (`?mes=11&ano=2026`): o Context lê com `useSearchParams` (`lib/periodo.lerPeriodo`) e escreve com
     `router.replace` (`comPeriodo`), como no `DashboardContext`.
   - A `View` consome o Context e monta `Template` + `Organisms`, com os estados carregando, vazio, erro e sem conexão.
   - **Uma tela não importa outra tela.** O que duas telas compartilham vira componente, hook global ou `lib/`.
3. **`components/` são puros:** recebem dados e callbacks por props.
   - **Organisms não usam `hooks/`, `services/` nem `actions/`.** Quem busca dados e chama ações é o Context da tela.
   - Formulários podem usar React Hook Form + o schema Zod (estado de UI), mas enviam por `onSubmit` vindo da View.
   - `next/link` e ícones são permitidos (são UI). Rota ativa, usuário logado etc. chegam por props.
4. **Hierarquia:** atoms ← molecules ← organisms (podem usar outros organisms) ← templates. Templates só fazem layout e recebem
   `children` ou slots (`sidebar`, `bottomNav`, `header`, `cabecalho`…).
5. **Nomes:** `components/` no padrão shadcn (arquivo kebab-case, export PascalCase, teste ao lado, sem pasta por componente e sem
   `index.ts`); `screens/` com pasta e arquivos PascalCase (`DashboardView.tsx`) e um `index.ts` público.
6. **`eslint-plugin-boundaries`** impõe isto (`eslint.config.mjs`; mensagem "Arquitetura: X não pode importar Y"):

   | De | Pode importar |
   | --- | --- |
   | `app` | `screen`, `styles`, `types` |
   | `bff` (`app/api`) | `lib`, `types`, `constants` |
   | `screen` | `atom`, `molecule`, `organism`, `template`, `hooks`, `actions`, `schemas`, `types`, `constants`, `lib` e arquivos da **própria** tela |
   | `template` | `atom`, `molecule`, `organism`, `template`, `lib`, `types` |
   | `organism` | `atom`, `molecule`, `organism`, `schemas`, `types`, `constants`, `lib` |
   | `molecule` | `atom`, `molecule`, `lib`, `types` |
   | `atom` | `atom`, `lib`, `types` |
   | `hooks` | `hooks`, `services`, `schemas`, `types`, `constants`, `lib` |
   | `services` | `services`, `types`, `constants`, `lib` |
   | `actions` | `actions`, `schemas`, `types`, `constants`, `lib` |
   | `schemas` | `schemas`, `types`, `constants`, `lib` |
   | `constants` | `constants`, `types` |
   | `lib` | `lib`, `types`, `constants` |
   | `types` / `styles` | só o próprio tipo |

   Testes (`*.test.ts(x)`) e `src/test/**` ficam fora das regras. Pacotes externos (`react`, `next/*`, `lucide-react`…) não são checados.
7. **Testes:** componentes testados por props (Vitest + RTL); telas com Provider + View + MSW (integração); fluxos com Playwright;
   `app/**` fora da cobertura; pisos 80/70.

Camadas de dados: `lib/http` → `services/` → `hooks/` → **Context da tela** → props dos organismos. Nenhum componente monta URL nem chama `fetch`.

### Fluxo de autenticação e dados (BFF)

```
Navegador ──► Next (mesma origem)                                   ──► Spring API
             • Server Actions: login/cadastro/logout                     /api/auth/*
               → grava o JWT em cookie httpOnly `pm_token`
             • proxy.ts: rotas de (app) sem cookie → /login?voltar=…
             • app/api/[...path]/route.ts: repassa a chamada,            /api/*
               lendo o cookie e mandando `Authorization: Bearer`
```

- **Por quê:** o token não fica em `localStorage` (protegido contra XSS); não há CORS (tudo é mesma origem); a URL da API fica escondida.
- `src/proxy.ts`: protege `/dashboard`, `/lancamentos/**`, `/categorias` e `/perfil` (guardando o destino em `?voltar=`) e manda quem já
  está logado de `/login`/`/cadastro` para `/dashboard`. Só confere a **presença** do cookie; quem valida o token é a API.
- BFF: só repassa as rotas da lista de `lib/bff-rotas.ts` (as que os `services/` usam: `lancamentos/*`, `categorias/*`, `dashboard`,
  `usuarios/me`, `usuarios/me/foto`, `usuarios/me/dados`, `auth/recuperar-senha` e `auth/redefinir-senha`); o resto, inclusive
  `auth/login`, `auth/cadastro`, `usuarios/me/senha` e `usuarios/me/excluir` (Server Actions), e segmento vazio, `.` ou `..` (mesmo
  codificado) respondem 404 sem chamar a API. Rota nova no `services/` entra nessa lista. Um único handler para GET/POST/PUT/PATCH/DELETE. Repassa query, body (inclusive multipart, com `duplex: 'half'`) e devolve status,
  corpo e headers (`Content-Type`, `Content-Disposition`). Se a API responder 401, apaga o cookie e devolve 401; o `AppProviders` então
  leva a pessoa para `/login?voltar=<página atual>`. O login volta para lá com `lib/destino.destinoSeguro` (só caminho interno).
- `src/lib/session.ts` (`import 'server-only'`): `obterToken()`, `gravarSessao(token, expiraEm)`, `encerrarSessao()`; nome do cookie em `lib/sessao-cookie.ts`.
- **Senhas fora do terminal (20/11):** o `next dev` do Next 16 registrava cada Server Action com os argumentos
  (`└─ ƒ loginAction({"email":…,"senha":"…"})`), deixando em texto as senhas do login, cadastro, troca de senha e exclusão de
  conta. O `next.config.ts` desliga só isso com `logging.serverFunctions: false` (o log `POST /login 200 in …` e os erros
  continuam); `src/test/next-config.test.ts` garante. Não volte a ligar, e não ponha `console.log` com os dados de uma Action.
- **`cacheComponents` (Next 16) está ligado:** páginas e layouts viram estáticos por padrão. Quem lê `cookies()`, `headers()`,
  `searchParams` ou usa `useSearchParams` fica dentro de um `<Suspense>`; se não, o build falha. Guias locais:
  `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` e `authentication-with-cache-components.md`.

### Casca da área logada (`AppShellTemplate` + `screens/AppShell`)

| Largura | Navegação | Topo |
| --- | --- | --- |
| < 768px (celular) | slot `bottomNav` fixo embaixo (Início · Lançamentos · [+] · Categorias · Perfil) | slot `header` (TopBar) fixo no topo |
| 768–1023px (tablet) | slot `sidebar` no **trilho** (72px); `aberta` abre a sidebar (256px) **por cima**, com véu; véu, Esc ou escolher um item fecham | título e mês no conteúdo |
| ≥ 1024px (computador) | sidebar **expandida** (256px) empurrando o conteúdo; `recolhida` vira trilho e o conteúdo ganha a largura | título e mês no conteúdo |

- A preferência do computador fica no cookie `sidebar=recolhida|expandida` (`lib/sidebar-cookie.ts`), lido **no servidor** por
  `screens/AppShell/AppShell.tsx` para a página já chegar no modo certo. No tablet a abertura é passageira (não grava cookie).
- O template expõe o estado em `data-sidebar-recolhida`/`data-sidebar-aberta`. O organismo da sidebar usa a variante **`trilho:`**
  (definida no `globals.css`) para o modo de ícones: `trilho:sr-only` no nome, `trilho:justify-center`, `trilho:hidden` no logo grande.
- Layout que depende da largura é **sempre CSS** (`md:`, `lg:`, `trilho:`). `useMediaQuery` (hooks) só decide comportamento e ARIA
  (o que o botão `panel-left` faz e o `aria-expanded`), porque no servidor ele devolve `false`.
- Telas de formulário (`/lancamentos/novo`, `/lancamentos/[id]/editar`) não recebem a barra inferior: o rodapé fixo com "Salvar" ocupa o lugar.
- Sem `sidebar` nem `bottomNav`, o template vira a casca simples (futura visualização por link, DS "Preparado para crescer").
- A `AppShellView` pluga os organismos: `Sidebar` (slot `sidebar`, com `prenderFoco` quando aberta por cima no tablet), `TopBar`
  (slot `header`: título, Voltar, `MonthNavigator` compacto e avatar, conforme `constants/navegacao.topoDaRota`) e `BottomNav` +
  `CreateSheet` (slot `bottomNav`; o + abre a folha). O mês da TopBar vem da URL (`AppShellContext`, igual ao `DashboardContext`) e os
  links de Dashboard e Lançamentos levam o mesmo `?mes=&ano=` (`ROTAS_COM_MES`). "Sair" chama a `logoutAction` (apaga o cookie
  httpOnly e redireciona para `/login`).
- O "+ Novo lançamento" da sidebar leva direto a `/lancamentos/novo` (README e preview da Sidebar); a folha Criar é só do celular.
