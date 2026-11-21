# PoupaMais — FrontEnd (Web)

Aplicação web de gestão financeira pessoal e familiar (projeto de LES — Fatec Guarulhos, orientação Prof. Jadir Custódio Júnior).
O usuário registra **receitas e despesas** (lançamentos, com **data**), organiza por **categorias**, importa/exporta em lote via
**CSV/Excel** e acompanha um **Dashboard** mensal. Foco: letramento financeiro e prevenção do superendividamento (ODS 1 e 8).
Web **mobile-first e responsiva** (nasce para o navegador do celular); não há app nativo (RNI001).

Este repositório é **só o front**. A API (Java + Spring Boot + PostgreSQL + JWT) fica em `LES-PoupaMais/PoupaMais_BackEnd`.
O contrato está repetido abaixo; se mudar aqui, mude lá também.

**Fontes da verdade (pasta do workspace `../`, fora do repo):**

| O quê | Onde | Vale para |
| --- | --- | --- |
| **Design System** (visual) | `../Documentação/design/ds/project/`: `README.md` (princípios, cor, tipografia, voz), `Navegacao-e-layout.md`, `Graficos.md`, `Acessibilidade-e-casos-limite.md`, `Preparado-para-crescer.md`, `Para-copiar-no-codigo.md`, `tokens.json`/`tokens.css` e `components/<Nome>/{README.md,preview.html}` | tokens, componentes, estados, textos |
| **Pranchetas das telas** (canvas) | `../Documentação/design/telas/project/<tela>-<celular\|tablet\|computador>.dc.html` (uma por estado; mapa em `canvas.json`) | layout de cada tela e estado |
| Decisões de design | `../Documentação/design/MUDANCAS_RODADA2.md` (**vale sobre** a revisão) e `../Documentação/md/Revisao_Perguntas_Design_PoupaMais.md` | conflitos entre documentos |
| Requisitos | `../Documentação/DVP_PoupaMais_v1.md` (versão anterior; quando divergir, vale este `CLAUDE.md`) | RF/RN |

O protótipo antigo do Figma (telas escuras, MÊS/ANO no formulário, donut, switch "ATIVO") **não vale mais**: use o Design System e as pranchetas.

## Estado atual (19/11/2026)

- **Fundação pronta (B1, branch `feat/fundacao-front`):** arquitetura `app/ → screens/ → components/`, tokens do Design System com tema
  claro/escuro, Plus Jakarta Sans, templates (`app-shell`, `auth`, `public`, `dashboard`, `form-page`), `MoneyText`, `Logo`, contrato v1.1.0
  em `types/`, `services/`, `hooks/` e `schemas/`, regras de arquitetura no ESLint.
- **Navegação da área logada pronta (B2, branch `feat/navegacao`):** `month-navigator` (molécula), `sidebar`, `bottom-nav`, `top-bar` e
  `create-sheet` (organismos) ligados na `AppShellView`, e a `logoutAction` em `actions/auth.actions.ts`.
- **Componentes comuns prontos (B2, branches `feat/componentes-form` e `feat/componentes-feedback`):** átomos alinhados ao DS e moléculas
  de formulário e de exibição/feedback (✓ na tabela do Atomic Design).
- **Telas prontas e integradas (B4, branch `feat/telas-integradas`):** as 9 linhas da seção "Telas" (acesso, Dashboard, Lançamentos com
  visualização e Lixeira, Novo/Editar, Importar e Exportar, Categorias, Perfil, Landing, Privacidade, 404 e erro), com Context + View +
  MSW e E2E do roteiro da demo. Na integração ficou **uma versão de cada peça comum**: `useOnline` (conexão), `mostrarToastDesfazer` +
  `hooks/use-lixeira` (lixeira com Desfazer na lista, na visualização e no Editar), `categoria-dialog` (Categorias, folha Criar e
  campo do formulário), `transaction-detail` (visualização e Editar de item na lixeira), `useBaixarModeloCsv` (Lançamentos, Importar e
  vazio do Dashboard), `lib/baixar-arquivo` (exportar, modelo e "Baixar meus dados"), `lib/erro-categoria` sobre `traduzirErro` e
  `lib/format.plural`.
- **Revisão geral (19/11):** corrigida na própria branch (link de categoria do Dashboard, status no POST/PUT, `destinoSeguro`,
  BFF com lista de rotas, lixeira com DELETE na hora + restaurar, regra única de mensagens de erro em `lib/http`, entre
  outros). O contrato **v1.2.0** do back (status no POST/PUT, restaurar ao status anterior, `codigo` em todo erro e `data` em
  `maioresDespesas`) está na development do back desde 20/11 e espelhado abaixo.
- **Próximo passo:** revisar as Pendências abaixo com a equipe (as marcadas "decidir" esperam o líder/design).
- Leia também o `AGENTS.md` (gerado pelo Next): o Next 16 tem mudanças grandes; a documentação da versão instalada está em
  `node_modules/next/dist/docs/`. Consulte antes de usar API do Next que você não viu neste repo.
- Entrega do código no GitHub até **26/11/2026**. Sem deploy (decisão de 12/11/2026): roda localmente, API com
  `docker compose up -d --build` no backend e o front com `npm run dev` (`API_URL=http://localhost:8080`).

### Roteiro da demo: o front precisa suportar exatamente isto (os E2E cobrem)

1. Criar uma categoria pelo próprio campo de categorias do formulário → 2. Cadastrar lançamento com **duas** categorias e **data** →
3. Importar CSV com uma linha inválida (mostrar quais linhas falharam) → 4. Filtrar e **tirar do saldo** um lançamento →
5. Ver o dashboard atualizado → 6. Exportar lançamentos.

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

## Comandos

```bash
nvm use                 # Node da .nvmrc
npm run dev             # http://localhost:3000
npm run lint            # ESLint (inclui as regras da Arquitetura)
npm run format          # Prettier (format:check no CI)
npm run typecheck       # next typegen + tsc --noEmit
npm test                # Vitest
npm run test:coverage   # Vitest + piso de cobertura (o que o CI roda)
npm run test:e2e        # Playwright (sobe o build sozinho), API simulada
npm run test:e2e:api-real  # Playwright contra a API real (pilha E2E do PoupaMais_Development; ver Testes)
npm run build           # build de produção
```

`.env.local` (variáveis **só do servidor**, sem `NEXT_PUBLIC_`; o navegador nunca vê a URL nem o token da API):

```
API_URL=http://localhost:8080
```

E2E nesta máquina (WSL sem sudo): os navegadores precisam de
`export LD_LIBRARY_PATH=$HOME/.local/playwright-libs/root/usr/lib/x86_64-linux-gnu` (Chromium e Firefox já instalados em
`~/.cache/ms-playwright`). Não use `--with-deps` localmente; no CI ele é usado.

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

## Atomic Design

| Nível | Pasta | O que é | Exemplos (nome do DS → arquivo) |
| --- | --- | --- | --- |
| **Átomos** | `components/atoms` | shadcn/ui + átomos próprios no mesmo estilo. Sem domínio | **button** ✓, **input** ✓, **textarea** ✓, **label** ✓, **checkbox** ✓, **switch** ✓, **select** ✓, **badge** ✓, **avatar** ✓, **tooltip** ✓, **skeleton** ✓, separator, **dialog/alert-dialog** ✓, **popover** ✓, **drawer** ✓, **sheet** ✓ (véu com `overlayClassName`), sonner, chart; próprios: **logo** ✓, **money-text** ✓, **calendar** ✓, **function-icon** ✓, **progress** ✓ |
| **Moléculas** | `components/molecules` | Combinação de átomos, genérica | **form-field** ✓, **password-field** ✓, **money-field** ✓, **date-picker** ✓ (dias/meses/anos), **month-navigator** ✓, **segmented-control** ✓, **chip/filter-chip** ✓, **multi-select** ✓, **stat-card** ✓, **spend-rate** ✓, **labeled-progress** ✓, **empty-state** ✓, **error-state** ✓, **offline-banner** ✓, **action-banner** ✓, **confirm-dialog** ✓, **upload-area** ✓, **stepper** ✓, **timeline** ✓, **sub-row-list** ✓, **section-header** ✓ |
| **Organismos** | `components/organisms` | Seções completas, podem conhecer o domínio, **sem dados próprios** | **sidebar** ✓, **bottom-nav** ✓, **top-bar** ✓, **create-sheet** ✓, **highlight-card** ✓, **income-expense-chart** ✓, **balance-chart** ✓, **category-bar-chart** ✓, **maiores-despesas** ✓, **dashboard-secao** ✓ (card das seções do Dashboard), **transaction-row** ✓, **transaction-table** ✓, **transaction-detail** ✓, **filter-bar** ✓, **lancamento-form** ✓, **export-dialog** ✓, **categoria-dialog** ✓, **import-result** ✓, **formato-csv** ✓ (Importar), **categoria-lista** ✓ (Categorias), **excluir-conta-dialog** ✓, **login-form** ✓, **cadastro-form** ✓; do Perfil: **perfil-secao** ✓, **foto-perfil** ✓, **dados-pessoais-form** ✓, **alterar-senha-form** ✓, **aparencia-tema** ✓, **perfil-atalhos** ✓ |
| **Templates** | `components/templates` | Só layout e slots | **app-shell-template** ✓, **auth-template** ✓, **public-template** ✓, **dashboard-template** ✓, **form-page-template** ✓, **perfil-template** ✓ |

✓ = já existe. Cada componente nasce com teste e segue a preview do Design System (`../Documentação/design/ds/project/components/<Nome>/`):
tokens, estados e acessibilidade. Passo a passo: skill `componente-atomic`.

- **Novo átomo do shadcn:** `npx shadcn@latest add <nome>` (grava em `components/atoms`), depois `npm run format`.
  A CLI gera `import { cn } from "cn"`: troque por `@/lib/cn`. Hook que vier junto (ex.: `use-mobile`) vai para `lib/`.
- **Átomo gerado não é editado sem motivo.** Se precisar, marque cada alteração com `// PoupaMais:`, tire o arquivo da lista de exclusão
  de cobertura do `vitest.config.mts` e escreva o teste (exemplos: `button`, `avatar`).
- Moléculas e organismos **compõem** átomos do shadcn; não recriam botão/input/dialog do zero.
- **Button** (DS): variantes `primario` (padrão), `contornado`, `texto`, `perigo`, `perigo-texto`; tamanhos `padrao` (48px), `pequeno` (36px),
  `icone` (44px); `loading` = spinner + `aria-busy` + `aria-disabled` (mantém o foco e não envia de novo). Os nomes do shadcn (`default`,
  `outline`, `ghost`, `destructive`, `sm`, `icon`…) ficam como **apelidos** porque os átomos gerados pela CLI os usam; código novo usa os do DS.
- **Formulário:** `FormField` liga rótulo, ajuda, contador e erro ao controle (`id`, `aria-describedby`, `aria-invalid`); `PasswordField`,
  `MoneyField` (devolve **número** ou `null`; `parseBRL`/`formatarNumeroBR` em `lib/format`) e `DatePicker` (devolve **ISO** ou `null`;
  `lerDataDigitada` em `lib/data`) já usam o `FormField`. Com React Hook Form, use `Controller` para os campos controlados (money, data,
  multi-select, segmentado) e `register` para Input/PasswordField (repassam o `ref`).
- **DatePicker:** `apresentacao="popover"` (computador) ou `"folha"` (celular): quem decide é a tela (`useMediaQuery` no Context/View), o
  componente não lê a largura. O calendário é o átomo próprio `calendar` (três visões e teclado do DS, sem react-day-picker); `modo="mes"`
  serve ao MonthNavigator (`seletor="popover"|"folha"`). A folha (`drawer`) usa o Dialog do Radix (sem `vaul`, que não desmonta no
  jsdom): fecha pelo ×, véu ou Esc. Só a folha Criar (`create-sheet`) fecha também ao arrastar para baixo.
- Variantes via `cva`; cores só por token (`bg-primary`, `text-receita`, `bg-despesa-fundo`, `text-atencao`…), nunca hex.
- `'use client'` só onde há estado, efeito ou **evento** (ex.: o `AppShellTemplate`, que repassa o clique do véu e o Esc).

## Telas

Ordem de implementação (B4, pelo roteiro da demo). Cada tela segue o fluxo de 4 etapas da skill `tela-next`
(componentes → Context → View → rota limpa + testes) e é comparada com as pranchetas nos temas claro e escuro, a 390, 834 e 1440px.

| # | Telas | Rotas | Pranchetas (`../Documentação/design/telas/project/`) |
| --- | --- | --- | --- |
| 1 | Login, Cadastro, Esqueci e Redefinir senha, Sessão vencida | `(auth)/login`, `cadastro`, `esqueci-senha`, `redefinir-senha` | `login-*`, `cadastro-*`, `esqueci-*`, `redefinir-*`, `sessao-vencida-celular` |
| 2 | Dashboard (todos os estados) | `(app)/dashboard?mes&ano` | `dashboard-*` (celular, tablet, computador, escuro, recolhida, vazio, erro, carregando, atenção, acima, criar, menu-tablet) |
| 3 | Lançamentos: lista, filtros, visualização (painel/tela), Conta no saldo, mover para a lixeira com Desfazer | `(app)/lancamentos`, `lancamentos/[id]` | `lancamentos-*`, `lancamento-detalhe-*` |
| 4 | Novo/Editar lançamento (DatePicker, categorias com criar nova, descartar) | `lancamentos/novo`, `lancamentos/[id]/editar` | `novo-*`, `editar-*`, `nova-categoria-inline-celular`, `novo-categorias-celular` |
| 5 | Importar CSV + resultado · Exportar | `lancamentos/importar` (+ diálogo de exportar) | `importar-*`, `importando-celular`, `exportar-*` |
| 6 | Categorias | `(app)/categorias` | `categorias-*`, `categoria-*` |
| 7 | Lixeira (subtela de Lançamentos) | `lancamentos/lixeira` | `lixeira-*`, `editar-lixeira-computador` |
| 8 | Perfil (foto, senha, tema, dados LGPD, excluir conta) | `(app)/perfil` | `perfil-*`, `excluir-conta-*` |
| 9 | Landing, Privacidade, 404, erro global | `(public)/`, `privacidade`, `not-found`, `error` | `landing-*`, `privacidade-*`, `nao-encontrado-*`, `erro-geral-computador`; globais: `sem-internet-*`, `toasts-celular` |

Regras de navegação e layout (DS, `Navegacao-e-layout.md`):

- **Mês na URL** (`MonthNavigator`), compartilhado por Dashboard e Lançamentos; a Lixeira não depende do mês.
- **Lixeira, Novo, Editar, Visualizar e Importar são subtelas de Lançamentos:** na barra inferior o ativo é Lançamentos e o "‹" volta
  para Lançamentos (`constants/navegacao.itemAtivo`).
- **Formulário:** tela inteira com "Salvar lançamento" fixo no rodapé no celular; card centralizado no computador (`FormPageTemplate`).
  Sair com alterações não salvas pergunta antes ("Descartar alterações?", ConfirmDialog).
- **Visualizar lançamento** (TransactionDetail): abre ao tocar em qualquer lugar da linha; tela cheia no celular, painel à direita
  (~440px, com véu) no computador; ação principal Editar (na lixeira, Restaurar).
- **Lista:** cards (TransactionRow) + filtros em chips e folha no celular; tabela (TransactionTable) + barra de filtros acima no computador.
- **Busca:** filtra 500 ms depois da última tecla (`ESPERA_BUSCA_MS` e `useValorComEspera` em `hooks/use-valor-com-espera.ts`) e vai para a
  URL com `router.replace` (`?q=`, sem encher o histórico). O texto do campo fica no `LancamentosContext` (a `FilterBar` recebe `busca`
  e `onBuscaChange`) e é a fonte da verdade enquanto a pessoa digita: a URL só reescreve o campo quando muda por fora (Limpar filtros,
  chip removido, voltar no navegador), nunca pelo eco da própria busca, mesmo atrasado.
- **Dashboard (computador, 12 colunas):** Saldo (4) + tiles Receitas, Despesas e Taxa de gasto (8) · área Receitas × Despesas (8) +
  Saldo mensal (4) · Despesas por categoria (6) + Maiores despesas (6). Tablet em 2 colunas; celular em 1 coluna nessa ordem (`DashboardTemplate`).
- Destinos da sidebar: "Dia a dia" (Dashboard, Lançamentos, Categorias, Lixeira) e "Conta" (Perfil, Sair). Sem sino e sem menu ☰.
- **Avatar:** se `possuiFoto`, `/api/usuarios/me/foto?v={versão}` (`usuarioService.urlDaFoto`; mude a versão após trocar a foto); senão,
  a inicial do nome em maiúscula.

### Categorias (RF011 / UC009 / RN002)

- Tela própria **Categorias** (lista com criar, renomear, inativar, reativar e excluir; contagem de lançamentos do mês com
  `quantidadeLancamentos`).
- **Excluir** pede confirmação (`ConfirmDialog` "Excluir categoria?", decisão de 20/11) antes do `DELETE`. Categoria em uso
  (`422` no `DELETE`): a `mensagem` da API aparece no aviso de atenção do diálogo, com "Inativar categoria".
- No formulário de lançamento, o campo de categorias (multi-select) permite **criar uma nova no próprio campo**; a criada já entra selecionada.
  Categorias inativas não são selecionáveis.
- `409` = "Já existe uma categoria com essa descrição" (a `mensagem` da API, sem diferenciar maiúsculas/minúsculas), mostrado no
  campo do diálogo.
- Depois de criar, editar, inativar, reativar ou excluir: recarregar `categorias`, `lancamentos` e `dashboard` (`categoriaAlterada` em
  `lib/invalidacoes.ts`; os hooks já fazem).

### Conta no saldo e Lixeira (RN004 / RN006 / UC010)

- **"Conta no saldo"** (switch; nunca "Ativo"): ATIVO ⇄ INATIVO (`PATCH /lancamentos/{id}/status`; no formulário, o `status` vai no
  próprio `POST`/`PUT`, numa chamada só). Fora do saldo continua na lista,
  com o valor suave (`MoneyText suave`), e sai do dashboard.
- **"Mover para a lixeira"**, sem modal (decisão do líder, 19/11): o `DELETE /lancamentos/{id}` vai **na hora**, a linha some e
  aparece o toast "Movido para a lixeira · **Desfazer**" (5 s, com contador e barra). O **Desfazer chama o restaurar**, que volta ao
  status de antes (v1.2.0). Tudo em `hooks/use-lixeira` (`useMoverParaLixeiraComDesfazer`), usado na lista, na visualização e no
  Editar; erro no DELETE ou no restaurar mostra o aviso e recarrega lista, dashboard e lixeira.
- **Lixeira** (`/lancamentos/lixeira`, `status=DELETADO`): sem switch e sem Editar; ação **Restaurar** (`useRestaurarLancamento`, só pelo
  `POST /restaurar`: o `PATCH /status` de item na lixeira dá `422`) e o toast pelo status devolvido (`constants/textos`):
  "Restaurado como inativo. Ative para voltar ao dashboard." (INATIVO) ou "Lançamento restaurado" (ATIVO).
- Lançamento na lixeira não pode ser editado: em `/lancamentos/[id]/editar` mostrar o aviso e Restaurar.
- A exportação segue o filtro e não leva os itens da lixeira; a Lixeira não tem Exportar (decisão de 20/11).

## Textos fora do DS, aprovados em 19/11

Textos escolhidos nas telas, sem prancheta nem frase no Design System. O líder aprovou mantê-los em 19/11/2026: não troque
sem decisão nova (e, se trocar, registre no DS). Os que se repetem entre telas ficam em `constants/textos.ts`.

- **Toasts de lançamento:** "Lançamento salvo", "Lançamento fora do saldo. Ele continua na lista.", "Lançamento de volta ao
  saldo", "Movido para a lixeira" (com Desfazer), "Restaurado como inativo. Ative para voltar ao dashboard." e, desde a
  v1.2.0 (volta ao status anterior), "Lançamento restaurado"; "Arquivo exportado", "Modelo CSV baixado".
- **Toasts de categoria:** "Categoria criada", "Categoria \"X\" criada" (pelo campo do formulário), "Categoria
  renomeada/inativada/reativada/excluída".
- **Toasts do Perfil e do acesso:** "Nome salvo", "Foto atualizada", "Foto removida", "Senha alterada", "Seus dados foram
  baixados", "Sua conta foi excluída.", "Conta criada. Este é o seu mês.", "Senha nova salva. Entre com ela.".
- **Importar (D3, 20/11, aguardando aprovação):** botão "Baixar linhas ignoradas (.csv)" no `import-result` e o toast "Linhas
  ignoradas baixadas".
- **Erros genéricos de cada tela** (quando a API não manda mensagem ou é 5xx, regra de `lib/http`): "Não foi possível …"
  (salvar, mover para a lixeira, restaurar, mudar Conta no saldo, exportar, baixar o modelo, criar a categoria, enviar e
  remover a foto, salvar o nome, alterar a senha, baixar seus dados, excluir a conta), "Não foi possível salvar. O que você
  preencheu continua aqui." e "Confira os campos marcados.".
- **Frases por status** (`lib/http.MENSAGENS_POR_STATUS`): a do 401 é do DS; as de 400, 404, 409, 422, 503 e sem conexão.
- **Estados sem prancheta:** "Lançamento não encontrado · Ele pode ter sido excluído ou o endereço está errado."
  (visualização e Editar, `constants/textos`), vazio de filtro "Nada encontrado com esses filtros"/"Nada encontrado para
  “…”", erro geral com o botão "Voltar ao início" (fica) e "Não foi possível carregar as categorias.".

## Design

**O Design System manda** (`../Documentação/design/ds/project/README.md`). Resumo do que o código já tem:

- **Tokens** em `src/styles/globals.css`: o bloco "Para copiar no código" colado sem alteração (fonte `../Documentação/design/ds/globals.css.gerado`)
  mais os complementos do front (valores de `tokens.css`). Não edite as cores aqui: mude no DS e cole de novo.
  - shadcn: `bg-background` (fundo), `bg-card` (superfície), `bg-secondary`/`bg-muted` (superfície 2), `text-muted-foreground` (texto suave),
    `bg-primary` (ação), `bg-accent` (primária fundo), `text-destructive` (**erro e exclusão**, não despesa), `border-border`, `border-input`, `ring-ring`.
  - Domínio: `text-receita`/`bg-receita-fundo`/`receita-grafico`/`receita-area`, `text-despesa`/`bg-despesa-fundo`/`despesa-grafico`/`despesa-area`,
    `bg-erro-fundo`, `text-atencao` sobre `bg-atencao-fundo`, `destaque-*` (card Saldo do mês), `bg-sobreposicao` (véu), `primaria-hover`.
    Reservados sem uso hoje: `investimento`, `compartilhado`, `destaque` (+ `-fundo`).
  - Complementos: `shadow-card`, `shadow-flutuante`, `w-sidebar`/`w-trilho`/`pl-trilho`, `h-barra-inferior`, `max-w-conteudo` (1200px),
    raios `rounded-campo`/`rounded-icone`/`rounded-card`/`rounded-grande`/`rounded-pilula`, estilos de texto `text-display`, `text-titulo-1..3`,
    `text-rotulo-secao`, `text-corpo`, `text-corpo-forte`, `text-legenda`, `text-rotulo-campo`, `text-mini`, `text-valor-destaque|tile|linha`
    (tamanho, altura de linha, peso e espaçamento juntos) e a variante `trilho:`.
  - Token novo de tamanho, sombra, raio ou medida? Ensine o `cn` em `lib/cn.ts` (senão o merge apaga classes).
- **Tema:** claro e escuro **em todas as telas** (landing e auth não são mais sempre escuras), seguindo o sistema por padrão; a classe `dark`
  vai no `<html>` pelo `next-themes`. Use `dark:` só quando o token não resolve sozinho (ex.: trocar o logo).
- **Fonte única:** Plus Jakarta Sans 500–800. Todo valor usa `tabular-nums` (`MoneyText` já usa).
- **Valores:** `MoneyText` (`components/atoms/money-text.tsx`): sempre com centavos, sinal (`+`/`−` tipográfico) + seta + cor; `tipo`
  RECEITA/DESPESA/neutro, `tamanho` destaque/tile/linha, `suave`, `ajustar`. Formatação em `lib/format.ts`.
- **Datas:** `lib/data.ts`: campo e tabela "18/11/2026", lista do celular "18 nov", visualização "18 de novembro de 2026", auditoria
  "05/11/2026 às 19:42" no fuso de quem vê. Mês do filtro "Novembro 2026" (`formatarMesAno`).
- **Logo:** átomo `logo` (`horizontal`, `sidebar`, `cofrinho`), arquivos em `public/logos/`; troca pelo tema só com CSS.
- **Gráficos** (`Graficos.md`): **área** para Receitas × Despesas dos 4 meses (curvas monotônicas, `receita-area`/`despesa-area`, tooltip com
  centavos), **barras verticais** para o saldo mensal (positivo acima do zero em `receita-grafico`, negativo abaixo em `despesa-grafico`,
  valor com sinal na barra) e **barras horizontais** para despesas por categoria (todas em `despesa-grafico`, da maior para a menor; tocar
  abre Lançamentos filtrado). Eixo começando no zero com 3 marcas redondas ("R$ 5 mil"), grade tracejada, legenda em texto e tabela `sr-only`.
  **Nunca pizza nem rosca.** Recharts pelo átomo `chart` (`--chart-1` receita, `--chart-2` despesa).
- **Princípios:** um botão preenchido por tela; uma cor de função por card; cor diferencia tipos, não instâncias (chips de categoria neutros);
  nunca só cor; toda ação termina em toast; textos com "você", sem jargão, botões começando com verbo.
- **Estados de toda tela:** carregando (Skeleton), vazio (EmptyState com a próxima ação), erro (ErrorState com "Tentar de novo") e sem
  conexão (OfflineBanner, botões que gravam desabilitados com o motivo).
- **Acessibilidade** (`Acessibilidade-e-casos-limite.md`): AA nos dois temas, foco visível (anel de 2px), alvos de 44px, `aria-current="page"`
  na navegação, `aria-live` nos toasts, diálogos começando em Cancelar, `prefers-reduced-motion` (o `globals.css` já zera as animações).

## Regras de negócio que afetam a UI

- **RN001** (revista em 18/11/2026): `schemas/lancamento.schema.ts`: descrição obrigatória (≤ 100), tipo, **data** obrigatória (dia que
  exista, de 01/01/2000 a 31/12/2100, trafega como `AAAA-MM-DD`), valor > 0 (até R$ 999.999.999,99), ≥ 1 categoria. Listagens e dashboard
  continuam filtrados por mês/ano. Mostrar erro por campo; também exibir os `erros[]` vindos da API (`setError` do RHF).
- **RN002**: várias categorias por lançamento; criar pelo próprio campo; categorias inativas não podem ser selecionadas.
- **RN003/RN004**: o dashboard só reflete lançamentos que contam no saldo (ATIVO); após mudar "Conta no saldo", invalidar o dashboard
  (as mutations de `hooks/use-mutacoes-lancamento.ts` já invalidam lista, lixeira, dashboard e categorias, pelo mapa de `lib/invalidacoes.ts`). `taxaGasto` `null` → "Não disponível para o período".
- **RN006**: ATIVO/INATIVO alternam livremente; DELETADO só sai pelo restaurar (v1.2.0: volta ao status anterior; itens antigos sem
  esse dado voltam INATIVO).
- **RN007**: após importar, resumo "X lançamentos importados, Y linhas ignoradas" + linha e motivo de cada falha + categorias criadas.
- **RN008**: gráficos de 4 meses, top 5 despesas e `pesoMaioresDespesas` vêm prontos da API; o front só renderiza.
- **RN010 / RNI003**: mostrar a `mensagem` do dashboard (neutra). **Nunca** recomendar investimento.
- **RF005 / RN013**: filtros por descrição, mês, ano, tipo, status e categoria; a exportação usa os filtros ativos.
- **RN011**: `schemas/auth.schema.ts`: nome ≤ 150, e-mail válido ≤ 100, senha de 6 a 72 com confirmação, aceite da Política obrigatório.
- **RN012**: antes de enviar o CSV, checar no front se tem até 2 MB (a API também recusa acima de 5.000 linhas).
- **RN014**: na recuperação de senha, nunca dizer se o e-mail existe.
- **RN015**: foto JPG/PNG/WEBP até 2 MB (validar antes de enviar). E-mail não editável. Trocar a senha devolve token novo (Server Action troca o cookie).
- **RN016**: excluir conta → diálogo (digitar EXCLUIR + senha, oferecendo antes "Baixar meus dados") → Server Action → apagar o cookie → `/` com toast.
- **RNF006**: botão que envia dados fica **desabilitado com spinner** até a resposta (`<Button loading={isPending}>`). Lançamentos iguais são válidos.
- Mensagens claras, em português, sem termos técnicos (RNF007, RNF009, RNF010). **Erros (decisão de 19/11):** o front não deduz a
  causa pelo texto nem por status genérico. Mensagem da API → como veio; `erros[]` com campo → no campo; sem mensagem → a frase da
  tela ou do status; sem conexão, 401 e 5xx → frases do front. Tudo em `lib/http.traduzirErro` (mude lá, não nas telas).

## Contrato da API (espelho do CLAUDE.md do backend)

Versão do contrato: **v1.2.0** (20/11/2026): `status` no POST/PUT de lançamento, restaurar ao status anterior, `codigo` em toda
resposta de erro e `data` em `maioresDespesas`.

O navegador chama `/api/...` do **próprio Next**; o BFF repassa para `${API_URL}/api/...` com `Authorization: Bearer <token>`. JSON camelCase.
Login, cadastro, troca de senha e exclusão de conta passam por **Server Actions** (que chamam a API e gravam o cookie), não pelo BFF.
No código: tipos em `types/api.ts`, chamadas em `services/*.service.ts`, cache em `hooks/` e chaves em `constants/query-keys.ts`.

- `POST /auth/cadastro` `{nome, email, senha, aceiteTermos}` → `201` · e-mail já usado → `409`. O cadastro já cria as 11 categorias
  padrão (Alimentação, Educação, Freelance, Investimentos, Lazer, Moradia, Outros, Salário, Saúde, Transporte, Vestuário; RN002)
- `POST /auth/recuperar-senha {email}` → `202` sempre · `POST /auth/redefinir-senha {token, novaSenha}` → `204` (`422` token inválido/expirado)
- `POST /auth/login` `{email, senha}` → `{token, expiraEm, usuario: {id, nome, email}}` · `401` credenciais inválidas
- `GET /usuarios/me` → `{id, nome, email, possuiFoto, dataCadastro}` · `PUT /usuarios/me {nome}`
- `PUT /usuarios/me/senha {senhaAtual, novaSenha}` → `{token, expiraEm}` (via Server Action, que troca o cookie) · `422` se a senha atual estiver errada
- `GET|PUT|DELETE /usuarios/me/foto` (PUT multipart, campo `foto`)
- `GET /usuarios/me/dados` → download de `meus-dados-poupamais.json` ("Baixar meus dados" no Perfil; baixar como blob, nome do
  `Content-Disposition`). Conteúdo: `{geradoEm, perfil: {id, nome, email, dataCadastro, aceiteTermosEm, possuiFoto},
  categorias: [{id, descricao, ativa}], lancamentos: [<lançamento>, …]}`, com **todos** os lançamentos (inclusive INATIVO e DELETADO);
  sem lançamentos → `[]`. A foto não vai no JSON. Não confundir com a exportação CSV/XLSX de lançamentos (`/lancamentos/exportar`, filtrada).
- `POST /usuarios/me/excluir {senha}` → `204` (via Server Action, que apaga o cookie)
- `GET /categorias?ativa=&mes=&ano=` → `[{id, descricao, ativa, quantidadeLancamentos}]` · `POST /categorias {descricao}` → `201 {id, descricao, ativa}` (`409` duplicada) · `PUT /categorias/{id}` · `PATCH /categorias/{id}/status {ativa}` · `DELETE /categorias/{id}` (`422` se vinculada)
  - `GET` vem em ordem alfabética (sem diferenciar maiúsculas); sem filtro, **ativas primeiro**. `PUT`/`PATCH` → `200 {id, descricao, ativa}`.
    Descrição: trim, obrigatória, ≤ 255 (`400` com `erros[]`); duplicada no `PUT` → `409`; categoria de outro usuário → `404`.
  - `quantidadeLancamentos`: lançamentos ATIVO + INATIVO daquele mês (DELETADO não conta); sem `mes`/`ano`, o mês atual. `mes`/`ano` não filtram
    as categorias nem mudam a ordem; inválidos → `400`. `POST`/`PUT`/`PATCH` não trazem a contagem.
  - No lançamento: categoria inativa → `422`; inexistente/de outro usuário → `404`.
- Lista de lançamentos ordenada por data desc, id desc; `POST`/`PUT`/`PATCH`/`restaurar` devolvem o lançamento; `DELETE` de já deletado → `422`.
- `GET /lancamentos?descricao=&mes=&ano=&tipo=&status=&categoriaId=&pagina=&tamanho=` (sem `status` = ATIVO + INATIVO; `status=DELETADO` = Lixeira)
  → `{itens: [<lançamento>], pagina, tamanho, total, totalPaginas}`. `pagina` desde 0 (padrão 0), `tamanho` 1–100 (padrão 12); fora disso → `400`.
  "Mostrar mais" com `useInfiniteQuery`; o contador "Mostrando 12 de 30" vem de `total`. A exportação ignora a paginação.
- `GET /lancamentos/{id}` · `POST /lancamentos` · `PUT /lancamentos/{id}`, com body `{descricao, tipo, data: "2026-11-05", valor, categoriaIds, status?}`
  (`data` ISO; o front mostra dd/mm/aaaa). Dia que não existe (`2026-02-31`) ou formato errado → `400` no campo `data`; fora de 2000–2100 → `422`.
  **v1.2.0:** `status` opcional (`ATIVO`|`INATIVO`): no POST o padrão é ATIVO; no PUT, omitido, mantém; `DELETADO` → `400` no campo
  `status`. PUT de item na lixeira → `422`. O POST nasce com `dataAtualizacao: null`.
- `PATCH /lancamentos/{id}/status {status: "ATIVO"|"INATIVO"}` (`422` se DELETADO: não tira da lixeira) · `DELETE /lancamentos/{id}` →
  status DELETADO, guardando o status anterior · `POST /lancamentos/{id}/restaurar` → volta ao status anterior (sem esse dado, INATIVO);
  fora da lixeira → `422`
- `POST /lancamentos/importar` multipart, campo `arquivo` → `{totalLinhas, importados, falhas: [{linha, conteudo, motivo}], categoriasCriadas}`
- `GET /lancamentos/exportar?formato=csv|xlsx&<filtros>` → arquivo (baixar como blob, nome vindo do `Content-Disposition`)
- `GET /lancamentos/template-csv` → arquivo
- `GET /dashboard?mes=&ano=` →
  `{mes, ano, receitas, despesas, saldo, taxaGasto|null, classificacaoTaxa: "DENTRO_DO_LIMITE"|"ATENCAO"|"ACIMA_DO_LIMITE"|null, mensagem, ultimosMeses: [{mes, ano, receitas, despesas, saldo}] (4), despesasPorCategoria: [{categoriaId, descricao, valor}], maioresDespesas: [{id, descricao, data, valor, categorias: string[]}], pesoMaioresDespesas: {valor, percentual|null}}`
  (`pesoMaioresDespesas`: soma das 5 maiores e % sobre as despesas do mês, 2 casas; `percentual` `null` sem despesa).
  **v1.2.0:** `data` (`"2026-08-05"`) em cada item de `maioresDespesas`, mostrada como "1 nov" (`formatarDataCurta`) antes das categorias.

Lançamento: `{id, descricao, tipo: "RECEITA"|"DESPESA", data, valor, status: "ATIVO"|"INATIVO"|"DELETADO", categorias: [{id, descricao}], dataCadastro, dataAtualizacao, dataExclusao}`
(`data` = `"2026-11-05"`; `dataCadastro`/`dataAtualizacao`/`dataExclusao` = instantes ISO em UTC (`dataAtualizacao` `null` até a primeira alteração), ex. `"2026-08-03T09:30:15Z"`, mostrar no fuso local;
`dataExclusao` preenchida ao ir para a Lixeira e `null` ao restaurar).
**Erro (v1.2.0):** `{status, codigo, mensagem, erros?: [{campo, mensagem}]}`, ex. `{ "status": 422, "codigo": "CATEGORIA_VINCULADA",
"mensagem": "Categoria vinculada a lançamentos, apenas inative" }`. `erros[]` só vem no `400 VALIDACAO`. Exibir com
`lib/http.traduzirErro`: `mensagem` em toast/aviso e `erros` nos campos (`setError` do RHF), como vieram. O **`codigo`** é uma string
estável (MAIÚSCULAS_COM_UNDERSCORE, nunca renomeada) e fica em `ErroApi.codigo` / `RespostaErro.codigo` (opcional no tipo, porque
o BFF e o `lib/http` também montam erros sem ele: sem conexão, 404 de rota fora da lista), mas **o front não decide nada pelo
código** (decisão de 20/11): mostra a `mensagem` da API ou a genérica. Tabela completa ("Padrão de erro") no `CLAUDE.md` do back;
resumo:

| Status | Códigos |
| --- | --- |
| 400 | `VALIDACAO` (com `erros[]`), `CORPO_INVALIDO`, `FORMATO_EXPORTACAO_INVALIDO`, `REQUISICAO_INVALIDA`, `PARAMETRO_INVALIDO`, `PARAMETRO_AUSENTE` |
| 401 | `NAO_AUTENTICADO` (sem token, expirado, sessão derrubada), `CREDENCIAIS_INVALIDAS` (login) |
| 403 | `ACESSO_NEGADO` (reservado) |
| 404 | `NAO_ENCONTRADO` (rota), `CATEGORIA_NAO_ENCONTRADA`, `LANCAMENTO_NAO_ENCONTRADO`, `FOTO_NAO_ENCONTRADA` |
| 405 | `METODO_NAO_PERMITIDO` |
| 406 | `TIPO_RESPOSTA_NAO_ACEITO` |
| 409 | `EMAIL_JA_CADASTRADO`, `CATEGORIA_DUPLICADA` |
| 415 | `TIPO_CONTEUDO_NAO_SUPORTADO` (antes da v1.2.0 saía 500) |
| 422 | arquivos: `ARQUIVO_GRANDE_DEMAIS` (413 se o servidor recusar antes), `ARQUIVO_VAZIO`, `ARQUIVO_INVALIDO`, `CABECALHO_INVALIDO`, `ARQUIVO_LINHAS_DEMAIS`, `SEM_DADOS_EXPORTACAO`; conta: `ACEITE_TERMOS_OBRIGATORIO`, `DADOS_CONTA_INVALIDOS`, `SENHA_ATUAL_INCORRETA`, `SENHA_IGUAL_A_ATUAL`, `SENHA_INCORRETA`, `TOKEN_INVALIDO`, `FOTO_TIPO_INVALIDO`; categorias: `CATEGORIA_INVALIDA`, `CATEGORIA_INATIVA`, `CATEGORIA_VINCULADA`; lançamentos: `LANCAMENTO_INVALIDO`, `LANCAMENTO_NA_LIXEIRA`, `LANCAMENTO_JA_EXCLUIDO`, `LANCAMENTO_NAO_EXCLUIDO`, `STATUS_INVALIDO`, `TRANSICAO_STATUS_INVALIDA` |
| 500 | `ERRO_INTERNO` (sem detalhes) |

Rota inexistente (com token) → `404` "Recurso não encontrado"; método não suportado → `405`. Parâmetro de rota/query/header com tipo errado → `400 PARAMETRO_INVALIDO`; parâmetro, part ou header obrigatório ausente →
`400 PARAMETRO_AUSENTE` (os dois sem `erros[]`); `Accept` sem formato que a rota produz → `406 TIPO_RESPOSTA_NAO_ACEITO` (back #32, 20/11).
Fica fora do padrão, por decisão de 20/11: a recusa de CORS do Spring (`403` texto puro; o navegador não chama a API direto).

CSV de importação (RN012): separador `;`, cabeçalho `descricao;tipo;data;valor;categorias`, data em `dd/mm/aaaa` (dia que exista), várias categorias separadas por `|`.
A exportação CSV/XLSX acrescenta a coluna `status`; no XLSX a data é célula de data.

## Convenções

- `components/`, `hooks/`, `services/`, `schemas/`, `lib/`: arquivos em kebab-case (`transaction-row.tsx`, `use-lancamentos.ts`), exports
  PascalCase (componentes) e camelCase (`useLancamentos`); services `xxx.service.ts` (objeto `xxxService`); schemas `xxx.schema.ts`.
  `screens/`: pasta e arquivos PascalCase.
- Textos de interface em português; identificadores sem acento.
- Query keys só por `constants/query-keys.ts`; rotas por `constants/rotas.ts`; destinos da navegação por `constants/navegacao.ts`.
- Valores sempre por `MoneyText`/`lib/format.ts`; datas por `lib/data.ts`. A API trabalha com número decimal.
- Nada de token em `localStorage`; a sessão é só o cookie httpOnly. `localStorage` só para conveniência (nunca para dados).
- Responsivo mobile-first; testar em Chrome, Edge e Firefox (RNF016).
- Toda tela ou componente nasce **com testes**. Sem teste, não está pronto.
- **Git (Gitflow):** `feat/<card>` criada a partir da `development` → PR para a `development` → quando estável, PR `development` → `main`.
  Nunca PR de `feat/*` direto para a `main` e nunca commit direto na `development` ou na `main`. Conventional Commits em português
  (`feat(dashboard): ...`).

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
  - Páginas (navegação): **network-first**; sem internet, a última cópia guardada (o app abre offline).
  - `GET /api/*`: **network-first**; sem internet, a última resposta guardada (consulta só de leitura). As consultas do
    TanStack Query usam `networkMode: 'offlineFirst'` (`AppProviders`) para tentar mesmo offline e receber essa cópia; a tela
    mostra os dados guardados e a faixa "Sem internet agora…", e os botões que gravam continuam desabilitados.
  - **Fora do cache:** POST/PUT/PATCH/DELETE e Server Actions (header `Next-Action`); respostas que não são 200,
    redirecionamentos e downloads (`Content-Disposition: attachment`: exportar, modelo CSV); `/api/usuarios/me/dados`; as
    rotas de acesso (`/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` e `/api/auth/*`); outras origens.
  - **Limpeza:** "Sair" (casca e Perfil), sessão vencida (401 no `AppProviders`) e conta excluída mandam
    `{tipo: 'limpar-dados'}` (`lib/service-worker.limparDadosOffline`), que apaga as respostas da API e as páginas guardadas;
    qualquer 401 de `/api/*` também limpa no próprio service worker. Nada de uma pessoa fica no aparelho para a próxima.
- **Registro:** `screens/App/RegistroServiceWorker` (no `AppProviders`) chama `lib/service-worker.registrarServiceWorker`, que só
  registra com `NODE_ENV=production` e `'serviceWorker' in navigator`. No `npm run dev` não há service worker.
- **Onde instala:** só em **HTTPS** ou em `localhost`. Pelo IP da rede (`http://192.168.x.x:3000`) o navegador não registra o
  service worker nem oferece instalar. Para testar no celular: o modo "como produção" do PoupaMais_Development
  (`https://poupamais.localhost:8443`) ou, de verdade, depois do deploy com HTTPS.
- **Como testar:** `npm run build && npm run start`, abrir `http://localhost:3000` no Chrome → DevTools > **Application**
  (Manifest: nome, ícones e "Installable"; Service workers: ativo; Cache storage: `poupamais-*`; marque "Offline" e recarregue
  uma tela já visitada) e **Lighthouse** (categoria PWA / "Installable"). No celular (Chrome Android): menu ⋮ > "Instalar app";
  no iPhone (Safari): Compartilhar > "Adicionar à Tela de Início".
- **Testes:** `src/test/sw.test.ts` roda o próprio `public/sw.js` num contexto isolado do Node (estratégias, o que não entra no
  cache, limpeza, 401, install/activate); `lib/service-worker.test.ts` e `RegistroServiceWorker.test.tsx` (registra só em produção,
  manda `limpar-dados`); `e2e/pwa.spec.ts` no build de produção (manifest e ícones respondem, SW registra). Os outros E2E rodam com
  `serviceWorkers: 'block'` (`playwright.config.ts`), porque o service worker passaria na frente do `page.route('**/api/**')`.

## Testes

Guia detalhado: skill `testes-frontend`.

| Nível | Onde | Ferramentas | O que prova |
|---|---|---|---|
| **Unitário** | ao lado do arquivo (`format.test.ts`, `lancamento.schema.test.ts`) | Vitest | Formatação, datas, schemas Zod, utilitários, services |
| **Componente** | ao lado do componente (`money-text.test.tsx`) | Vitest + Testing Library + `user-event` | O que o usuário vê e faz **por props**; acessibilidade básica |
| **Hooks globais** | `hooks/*.test.tsx` | `renderHook` + `criarWrapper()` + MSW | Paginação, invalidação após mutations |
| **Integração da tela** | `screens/<Tela>/<Tela>View.test.tsx` | Provider + View + **MSW** (`renderComProviders`) | Carregando, vazio, erro, sucesso, ações e toasts |
| **End-to-end** | `e2e/*.spec.ts` | **Playwright** (Chromium e Firefox) | Fluxos completos sobre o build de produção |

- **E2E sem backend (`npm run test:e2e`):** sessão pelo cookie `pm_token` (o `proxy.ts` só confere a presença) e API simulada no navegador com
  `page.route('**/api/**')` (`e2e/fixtures/`). Cobrir o roteiro da demo.
- **E2E contra a API real (`npm run test:e2e:api-real`, `e2e/api-real/` + `playwright.api-real.config.ts`):** o roteiro da demo
  inteiro com Spring, Postgres e Mailpit de verdade, só no Chromium (Firefox: `--project=firefox`), fora do CI por enquanto.
  - Subir a pilha: `cd ../PoupaMais_Development && E2E_FRONT_PORT=3130 npm run e2e:up` (API `127.0.0.1:8580`, Mailpit `8525`,
    banco `5435`, projeto docker `poupamais-e2e`); derrubar com `npm run e2e:down`. Não mexe na pilha dev (`poupamais`).
  - O config sobe `next build && next start` em `PORT` (padrão **3130**) com `API_URL=http://localhost:8580` (build de produção,
    como a outra suíte: sem a compilação sob demanda do `next dev`). Um `globalSetup` (`apoio/conferir-pilha.ts`) para a suíte
    com a instrução certa se a API ou o Mailpit não responderem.
  - Cada teste ganha um **usuário novo** (fixtures `usuario` e `logado` de `apoio/teste.ts`; e-mail único) e monta os dados pela
    API (`apoio/api.ts`); nada depende de ordem nem de banco limpo. Lembre que o cadastro já cria as 11 categorias padrão
    (`categoria()` reaproveita a existente). Datas fixas em outubro de 2026 (`MES`/`ANO`), sem depender do relógio.
  - O "esqueci a senha" lê o link pela API HTTP do Mailpit (`apoio/mailpit.ts`) e abre só o caminho `/redefinir-senha?token=…`
    no Next do teste (o domínio do link vem do `FRONT_URL` da pilha).
  - Prazos maiores (passo 20 s, teste 90 s): cada passo vai até a API e o banco. Com a máquina muito carregada (várias worktrees
    rodando testes ao mesmo tempo), o navegador pode travar; rode de novo com a máquina livre antes de culpar o código.
- **Largura nos testes:** o jsdom não tem `matchMedia`; `src/test/media.ts` instala um falso (cada teste começa em 390px) e
  `simularLargura(1280)` muda. No E2E, `page.setViewportSize`.
- **Cobertura (Vitest v8):** `npm run test:coverage` falha abaixo de **80% de linhas, funções e statements e 70% de branches**.
  Fora da conta: átomos do shadcn **sem lógica nossa** (lista no `vitest.config.mts`), `app/**` (só rotas, cobertas pelo E2E), `styles/**`,
  `**/index.ts`, `src/test/**`, `proxy.ts` e `.d.ts`. `screens/**` entra.

## Pipeline (CI: GitHub Actions)

Arquivo: `.github/workflows/ci.yml`. Roda em push na `development` e na `main` e em todo PR; um push novo no mesmo PR cancela o anterior.

| Job | Passos | Reprova se |
|---|---|---|
| `qualidade` (Lint, tipos, testes e build) | `npm ci` · `lint` · `format:check` · `typecheck` · `test:coverage` · `build` · publica `coverage/` | erro de lint/arquitetura, formatação, tipo, teste, cobertura abaixo do piso ou build quebrado |
| `e2e` (Testes end-to-end), depois de `qualidade` | `npm ci` · `npx playwright install --with-deps chromium firefox` · `npm run test:e2e` · publica `playwright-report/` se falhar | qualquer fluxo E2E quebrado |

- Rodar o mesmo localmente: skill `pipeline-local`. O Vitest usa metade dos núcleos (`maxWorkers: '50%'` no `vitest.config.mts`;
  com todos, testes de tela passavam do timeout de 5 s com a máquina ocupada). Localmente o Playwright usa 3 workers (com mais, o Firefox estoura o tempo no WSL).
  Com várias worktrees ao mesmo tempo, use uma porta por worktree (`PORT=3101 npm run test:e2e`): o `reuseExistingServer` reaproveita
  qualquer servidor que já esteja na porta e testaria o build de outra pasta.
- **Regra da equipe:** PR só é integrado com o CI verde e 1 aprovação. Sem deploy: a entrega roda localmente.

## Claude Code: skills e plugins

| Skill (`.claude/skills/`) | Quando |
|---|---|
| `componente-atomic` | Criar ou alterar componente (nível, arquivo, imports, pureza, teste) |
| `tela-next` | Criar ou alterar uma tela/rota: fluxo de 4 etapas (componentes → Context → View → rota) |
| `testes-frontend` | Escrever ou corrigir testes (Vitest, MSW, Playwright); cobertura reprovando |
| `pipeline-local` | Antes de dizer "pronto", commitar ou abrir PR; CI falhou |
| `mudanca-de-regra` (na raiz do workspace) | O pedido contradiz o DVP, o Design System ou o contrato |

Plugins recomendados (`/plugin`): `playwright` (navegar na app e depurar E2E), `feature-dev`, `pr-review-toolkit`, `commit-commands`,
`security-guidance`, `context7` (documentação atualizada de Next/React/Tailwind).

## Direção futura (ideias a discutir)

Leia `doc/IDEIAS_FUTURAS.md` antes de propor funcionalidade nova, e a seção "Preparado para crescer" do Design System: o que já está
reservado (cores, navegação, casca de visualização) para crescer sem refazer o design. Nada disso é para implementar sem decisão da equipe.

## Pendências

Débito conhecido (registre aqui o que ficar de fora e tire quando resolver):

1. **Navegação (sobras do B2): feito em 20/11.** O nome do mês do `MonthNavigator` abre o calendário no modo mês (prop
   `seletor`: `popover` no cabeçalho do Dashboard e na `FilterBar`, `folha` na TopBar do celular; a folha usa o título
   "Mês exibido", o `aria-label` do DS). A folha Criar fecha ao arrastar para baixo pela alça ou pelo título (pointer events,
   80px ou um gesto rápido; com `prefers-reduced-motion` não acompanha o dedo, só fecha).
2. **Mensagens do schema × DS: decidido e feito em 20/11.** `schemas/lancamento.schema.ts` usa as frases do DS e da prancheta
   `novo-erros-celular` ("A descrição é obrigatória.", "A descrição deve ter no máximo 100 caracteres.", "Escolha Receita ou Despesa.",
   "Informe uma data válida, no formato dd/mm/aaaa.", "Informe um valor maior que zero." para vazio e zero, "O valor máximo é
   R$ 999.999.999,99." e "Informe pelo menos uma categoria."), com o limite de **R$ 999.999.999,99**. Sem frase no DS, fica
   "Informe a data."; a data fora da faixa usa a frase do DatePicker, "Informe uma data entre 01/01/2000 e 31/12/2100." (feito em
   20/11, uma função só: `lib/data.mensagemDataForaDaFaixa`). Falta o README do MoneyField (DS) trocar o limite de
   R$ 99.999.999.999.999,99 para R$ 999.999.999,99.
3. **Mensagens de erro back↔front: decidido em 20/11.** O back passa a mandar um `codigo` estável em todo erro; o front
   **continua mostrando só a `mensagem` da API ou a genérica** e não decide nada pelo `codigo` (`RespostaErro` em `types/api` só
   ganhou `codigo?` opcional; `ErroApi.codigo` e o resultado de `lib/api-servidor` guardam o que a API mandou, sem uso nas telas).
   Contexto: desde 19/11 o front mostra a `mensagem` e os `erros[]` da API como vieram
   (regra em `lib/http.traduzirErro`; sem conexão, 401 e 5xx com frases do front). O líder vai repensar as mensagens entre back e
   front: mudar só em `lib/http` (e no back). Ficaram no front só os status que o contrato dá a um caso único e que mudam a tela:
   401 no login (credenciais), 409 no cadastro e na categoria (campo E-mail/Nome; a mensagem da API vai no campo), 422 no
   redefinir senha (link expirado) e no excluir categoria (em uso), 404 no `GET` por id (não encontrado). Sem `campo` no
   `erros[]`, a senha atual errada (troca de senha) agora sai em toast, não no campo; com um `erros[]` por campo do back, volta
   para o campo sozinha.
4. `doc/IDEIAS_FUTURAS.md` (compartilhado com o back) ainda fala em `lib/http → services → hooks → organismos`; a cadeia agora termina no
   Context da tela. Atualizar nos dois repositórios juntos.
5. **Componentes de exibição e feedback (B2) à espera de outros átomos:**
   - **Desbloqueado no merge do B2:** o átomo `alert-dialog` e o `button` (`perigo`, `padrao` 48px) já existem; falta aplicar abaixo.
   - `confirm-dialog` usa o primitivo `AlertDialog` do Radix direto (o átomo `alert-dialog` ainda não existia); trocar
     pelos componentes dele mantendo a API. O botão destrutivo usa `className` de perigo (`bg-destructive`) e `h-12` até o `button`
     ganhar as variantes e a altura de 48px do DS (o `error-state` já usa `contornado` 48px).
   - O átomo `card` ainda é o do shadcn (raio e anel antigos): as moléculas desenham a superfície do DS (`rounded-card border bg-card
     shadow-card`) com uma prop para tirar o cartão. Alinhar o `card` ao DS (`.pm-card`, `tamanho`, `destaque`) e passar a compor.
   - `skeleton` usa `animate-pulse` (o brilho em degradê do DS precisa de um `@keyframes` no `globals.css`).
   - ~~`action-banner` com a variante `sucesso`~~: **decidido e feito em 20/11**, removida (nenhuma tela usava; o DS tem info, atenção e erro).
   - `upload-area` ganhou na integração a prop opcional `onBaixarModelo` (botão com o mesmo visual do link `modeloHref`), para o modelo
     CSV baixar pelo hook com toast: registrar no README do UploadArea.
6. **Dashboard:**
   - O "mês vazio" é deduzido de `receitas = despesas = 0`: um mês só com lançamentos fora do saldo também cai no "Comece pelo seu
     primeiro lançamento". Resolver com uma contagem de lançamentos do mês no `GET /dashboard` (decisão com o back).
   - O gráfico de área não abre a dica no mês atual por padrão (a prancheta mostra "Nov" aberto como exemplo); abre com mouse, toque
     e teclado (setas, `accessibilityLayer` do Recharts).
7. **Novo/Editar lançamento:**
   - "Limpar" do celular é um botão fixo sobre a TopBar (a `TopBar` da casca não tem slot de ação). Proposta: prop `acao` na `TopBar`
     preenchida pela tela.
   - O campo de categorias abre em popover também no celular; a prancheta `novo-categorias-celular` pede folha de baixo. Proposta: prop
     `apresentacao` (`popover`/`folha`) no `multi-select`, como no `date-picker`.
   - Criar categoria pelo campo já usa o `categoria-dialog` (modo "nova", com os textos da prancheta `nova-categoria-inline-celular`);
     falta o lápis de editar/reativar categoria dentro do campo (o `multi-select` não tem a ação; o diálogo já tem o modo editar).
   - Editar de item na lixeira usa o `transaction-detail`: a auditoria aparece na `timeline` ("Histórico"), como na visualização
     (item 8), e não nas duas linhas "Criado em / Movido para a lixeira em" da prancheta `editar-lixeira-computador`.
   - Sessão vencida: o login mostra o aviso, mas o formulário não guarda rascunho; a frase "Seu rascunho foi guardado" (prancheta e DS)
     só entra quando houver rascunho.
8. **Lançamentos, visualização, exportar e Lixeira:**
   - Exportar é um **diálogo** (tela cheia no celular, card de 640px no computador) com o conteúdo das pranchetas `exportar-*`, que
     desenham uma página. **Decidido e feito em 20/11:** a Lixeira não tem "Exportar" (não está na prancheta `lixeira-*`); Exportar
     fica só em Lançamentos. Exportar a lixeira não está no escopo: a prop `lixeira` do `export-dialog` saiu (feito em 20/11, com
     os testes dela) e a dica ficou só "A lixeira fica de fora."
   - Visualização: a auditoria usa a `timeline` ("Histórico") no lugar das duas linhas "Criado em / Alterado em" da prancheta.
   - ~~Celular `/lancamentos/[id]`: o "‹" sempre "Lançamentos"~~: resolvido no PR #21 (a rota não tem TopBar, `semTopBar`; a
     tela desenha "‹ Lançamentos" ou "‹ Lixeira" pelo status, como na prancheta `lixeira-detalhe-celular`).
   - Textos sem prancheta: aprovados em 19/11 (seção "Textos fora do DS"); falta registrar no DS. Os toasts de Conta no saldo e
     lixeira ainda se repetem nos Contexts de Lançamentos, Lixeira, visualização e formulário: juntar em `constants/textos` se mudarem.
   - **Restaurar volta ao status anterior (v1.2.0): decidido e feito em 20/11.** Os textos ficaram neutros, sem prometer status:
     na visualização de item na lixeira (`transaction-detail`) "Não · ao restaurar, volta como estava antes"; na Lixeira, o aviso
     "Ao restaurar, o lançamento volta como estava antes de ir para a lixeira." e a dica da tabela "…Restaurar devolve o lançamento
     para a lista, como estava antes de ir para a lixeira.". As pranchetas `lixeira-*`, `editar-lixeira-computador` e o README do
     TransactionDetail (DS) ainda dizem "volta desligado"/"voltam fora do saldo": atualizar no DS.
9. **Importar e Categorias:**
   - ~~O `CLAUDE.md` dizia que "inativar uma categoria em uso (`422`)" mostra o aviso~~: alinhado em 20/11 (o `422` é do **DELETE**).
   - **Excluir categoria: decidido e feito em 20/11.** Pede confirmação no `ConfirmDialog` ("Excluir categoria?" · "A categoria X sai
     da sua lista. Não dá para desfazer." · "Excluir categoria"), que não está na prancheta `categoria-editar-celular`. No `422` (em
     uso), o aviso do diálogo mostra a `mensagem` da API no lugar da frase da prancheta `categoria-em-uso-celular`. Registrar no DS.
   - Editar uma categoria **inativa** (computador) mostra só Nome e Excluir: não há prancheta de "Reativar" dentro do diálogo (Reativar fica na linha).
   - Textos dos toasts de categoria ("Categoria criada/renomeada/inativada/reativada/excluída") não estão no DS: registrar no DS.
   - Importar sem `stepper`: as pranchetas `importar-*` não têm indicador de passos (escolher → importando → resultado na mesma tela).
   - O DS (ImportResult/UploadArea) cita `ResultadoImportacao`/`ImportarDialog`; no código são `import-result` e a tela `screens/Importar`.
   - **Baixar linhas ignoradas (D3, feito em 20/11):** com falhas, o `import-result` mostra "Baixar linhas ignoradas (.csv)"
     (contornado, ícone Download) abaixo da tabela; a tela monta no navegador (`lib/linhas-ignoradas`, sem chamar a API) o cabeçalho do
     modelo seguido dos `falhas[].conteudo` exatamente como vieram, **sem** a coluna de motivo (para reenviar sem editar), com BOM
     UTF-8 e `\r\n`, e baixa `linhas-ignoradas-AAAA-MM-DD.csv` (data local) por `lib/baixar-arquivo`, com o toast "Linhas ignoradas
     baixadas". Não está no DS nem nas pranchetas `importar-*`: registrar no DS (README do ImportResult).
10. **Perfil:**
   - `excluir-conta-dialog` compõe o `ConfirmDialog` com os campos nos `children` (não usa `confirmacaoDigitada`), porque a ajuda da
     prancheta fala também da senha ("…igual a EXCLUIR e a senha estiver preenchida." / "Tudo certo: o botão está liberado."). O
     `ConfirmDialog` não aceita `aria-describedby` no botão de confirmar nem um aviso dentro da descrição: o aviso "Não dá para desfazer."
     fica fora do `aria-describedby` do diálogo. Se o DS quiser, acrescentar essas duas props à molécula.
   - `useHidratado` (`hooks/use-hidratado.ts`, antes `useMontado` do Perfil): `false` no servidor e na hidratação. O tema do
     Perfil e o `useUsuario` usam: na hidratação o `useUsuario` devolve "carregando", igual ao HTML do servidor (sem isso, a
     página hidratava depois da casca e achava o usuário no cache: erro #418 no Dashboard e no Perfil, 20/11).
   - Sem prancheta de tablet do Perfil: a 834px fica em 1 coluna (as 2 colunas só aparecem com 420px cada, como o `auto-fit` da
     prancheta do computador).
   - E2E das Server Actions: o `playwright.config.ts` sobe a API falsa `e2e/api-falsa.mjs` na porta `PORT + 1000` (rotas `/api/auth/*`,
     troca de senha e excluir conta) e passa `API_URL` para o Next.
11. **Telas de acesso e públicas:**
   - **Privacidade:** a seção "Contato" é **provisória** (o canal do encarregado/DPO ainda não foi definido): trocar o texto quando houver.
   - **AuthTemplate no celular: decidido em 20/11, fica como está.** A prancheta `login-celular` não tem card (logo no topo à
     esquerda, texto alinhado à esquerda, rodapé só com a política); o template aprovado mantém o card central em todas as larguras
     (e o esqueci sem o "‹ Entrar" do topo). Só o cadastro do computador ganhou, a partir de 1024px, o topo da prancheta com
     "Já tenho conta" (`acaoComputador`), o card sem logo com o título à esquerda e o subtítulo "Só nome, e-mail e senha."
     (`subtituloComLateral`), na revisão visual de 20/11.
   - **Links de texto sublinhados (20/11, WCAG 1.4.1):** links dentro de frase e links soltos das telas públicas e de acesso
     ("Esqueci minha senha", "Criar conta", "Entrar", "Ler a Política de privacidade", rodapé do acesso) levam `underline`.
     Botões e links de navegação ("Voltar para o início", links do rodapé do site e do topo) ficam sem, como nas pranchetas.
   - Privacidade no celular usa o topo do site (a prancheta usa a TopBar com "‹"), com "Voltar para o início" acima do título.
   - **`global-error.tsx`: feito em 20/11.** Erro no próprio layout raiz: `<html>`/`<body>` próprios com a fonte e o CSS global,
     e a `ErroGlobalView` (`screens/ErroGeral`), que repõe o tema com um `ThemeProvider` só dela e mostra o mesmo erro da área
     pública ("Tentar de novo" e "Voltar ao início").
   - Componentes criados fora da tabela do Atomic Design: molécula `email-field`; organismos `esqueci-senha-form`, `esqueci-senha-enviado`,
     `redefinir-senha-form`, `link-expirado`, `cadastro-lateral`, `landing-hero`, `landing-beneficios`, `landing-passos`,
     `landing-dados`, `politica-privacidade`.
   - Landing: a prévia do Saldo do mês usa o `highlight-card` e a de "Despesas por categoria" usa o `category-bar-chart` em modo
     `previa` (sem links, total e dica; título h3), como a prancheta `landing-computador` (feito em 20/11).
12. **Integração e contrato:**
   - ~~Depende do back v1.2.0~~: integrado na development do back em 20/11 (PR #31 de lá); contrato espelhado na seção "Contrato da API".
   - **Roteiro da demo contra a API real:** feito em 20/11 (`npm run test:e2e:api-real`, seção Testes). Falta decidir se entra no
     CI (precisa subir a pilha E2E do PoupaMais_Development no runner: Docker + build do back).
   - **Pilha E2E (PoupaMais_Development):** feito em 20/11 (PR #4 de lá): `E2E_FRONT_PORT` padrão 3130, igual à suíte, e README atualizado.
   - **Texto do 409 da categoria: decidido e feito em 20/11.** A seção Categorias agora usa a frase da API ("Já existe uma categoria
     com essa descrição"), que o front já mostra; a frase de reserva do `lib/erro-categoria` (409 sem mensagem da API) passou de
     "Já existe uma categoria com esse nome." para "Já existe uma categoria com essa descrição." (feito em 20/11).
