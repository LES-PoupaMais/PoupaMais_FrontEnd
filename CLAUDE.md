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

## Estado atual (18/11/2026)

- **Fundação pronta (B1, branch `feat/fundacao-front`):** arquitetura `app/ → screens/ → components/`, tokens do Design System com tema
  claro/escuro, Plus Jakarta Sans, templates (`app-shell`, `auth`, `public`, `dashboard`, `form-page`), `MoneyText`, `Logo`, contrato v1.1.0
  em `types/`, `services/`, `hooks/` e `schemas/`, regras de arquitetura no ESLint. As telas ainda são **placeholders** no padrão novo
  (landing, login, cadastro, dashboard) e a navegação da área logada é **provisória** (`organisms/navegacao-provisoria.tsx`).
- **Próximos blocos (plano da Fase B):** B2 = biblioteca de moléculas e organismos a partir do Design System (em paralelo, por família);
  B4 = telas na ordem da seção "Telas". Cada bloco termina com a pipeline local verde e push.
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
| Dados remotos | TanStack Query (lista com `useInfiniteQuery`; invalidar lista, dashboard e categorias após mutações) |
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
npm run test:e2e        # Playwright (sobe o build sozinho)
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
- BFF: um único handler para GET/POST/PUT/PATCH/DELETE. Repassa query, body (inclusive multipart, com `duplex: 'half'`) e devolve status,
  corpo e headers (`Content-Type`, `Content-Disposition`). Se a API responder 401, apaga o cookie e devolve 401; o `AppProviders` então
  leva a pessoa para `/login?voltar=<página atual>`. O login volta para lá com `lib/destino.destinoSeguro` (só caminho interno).
- `src/lib/session.ts` (`import 'server-only'`): `obterToken()`, `gravarSessao(token, expiraEm)`, `encerrarSessao()`; nome do cookie em `lib/sessao-cookie.ts`.
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
- Hoje a View usa a navegação **provisória**. O B2 entrega `sidebar`, `bottom-nav`, `top-bar` e `create-sheet` (puros, com props) e a
  `AppShellView` passa a usá-los; então `organisms/navegacao-provisoria.tsx` é apagado.

## Atomic Design

| Nível | Pasta | O que é | Exemplos (nome do DS → arquivo) |
| --- | --- | --- | --- |
| **Átomos** | `components/atoms` | shadcn/ui + átomos próprios no mesmo estilo. Sem domínio | **button** ✓, **input** ✓, **textarea** ✓, **label** ✓, **checkbox** ✓, **switch** ✓, **select** ✓, badge, **avatar** ✓, tooltip, skeleton, separator, **dialog/alert-dialog** ✓, **popover** ✓, **drawer** ✓, sonner, chart; próprios: **logo** ✓, **money-text** ✓, **calendar** ✓, function-icon, progress |
| **Moléculas** | `components/molecules` | Combinação de átomos, genérica | **form-field** ✓, **password-field** ✓, **money-field** ✓, **date-picker** ✓ (dias/meses/anos), month-navigator, **segmented-control** ✓, **chip/filter-chip** ✓, **multi-select** ✓, stat-card, spend-rate, empty-state, error-state, offline-banner, action-banner, confirm-dialog, **upload-area** ✓, **stepper** ✓, timeline, sub-row-list, section-header |
| **Organismos** | `components/organisms` | Seções completas, podem conhecer o domínio, **sem dados próprios** | sidebar, bottom-nav, top-bar, create-sheet, highlight-card, income-expense-chart, balance-chart, category-bar-chart, transaction-row, transaction-table, transaction-detail, filter-bar, lancamento-form, categoria-dialog, import-result, excluir-conta-dialog, login-form, cadastro-form |
| **Templates** | `components/templates` | Só layout e slots | **app-shell-template** ✓, **auth-template** ✓, **public-template** ✓, **dashboard-template** ✓, **form-page-template** ✓ |

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
  serve ao MonthNavigator. A folha (`drawer`) usa o Dialog do Radix (sem `vaul`, que não desmonta no jsdom): fecha pelo ×, véu ou Esc.
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
- **Dashboard (computador, 12 colunas):** Saldo (4) + tiles Receitas, Despesas e Taxa de gasto (8) · área Receitas × Despesas (8) +
  Saldo mensal (4) · Despesas por categoria (6) + Maiores despesas (6). Tablet em 2 colunas; celular em 1 coluna nessa ordem (`DashboardTemplate`).
- Destinos da sidebar: "Dia a dia" (Dashboard, Lançamentos, Categorias, Lixeira) e "Conta" (Perfil, Sair). Sem sino e sem menu ☰.
- **Avatar:** se `possuiFoto`, `/api/usuarios/me/foto?v={versão}` (`usuarioService.urlDaFoto`; mude a versão após trocar a foto); senão,
  a inicial do nome em maiúscula.

### Categorias (RF011 / UC009 / RN002)

- Tela própria **Categorias** (lista com criar, renomear, inativar e reativar; contagem de lançamentos do mês com `quantidadeLancamentos`).
  Inativar uma categoria em uso (`422`) mostra o aviso "categoria em uso" no próprio diálogo.
- No formulário de lançamento, o campo de categorias (multi-select) permite **criar uma nova no próprio campo**; a criada já entra selecionada.
  Categorias inativas não são selecionáveis.
- `409` = "Já existe uma categoria com esse nome" (sem diferenciar maiúsculas/minúsculas), mostrado no diálogo.
- Depois de criar ou editar: invalidar `categorias`, `lancamentos` e `dashboard` (`useSalvarCategoria` já faz).

### Conta no saldo e Lixeira (RN004 / RN006 / UC010)

- **"Conta no saldo"** (switch; nunca "Ativo"): ATIVO ⇄ INATIVO (`PATCH /lancamentos/{id}/status`). Fora do saldo continua na lista,
  com o valor suave (`MoneyText suave`), e sai do dashboard.
- **"Mover para a lixeira"**, sem modal: a linha some na hora e aparece o toast "Movido para a lixeira · **Desfazer**" (5 s, com contador).
  O `DELETE /lancamentos/{id}` (`useMoverParaLixeira`) **só é enviado quando o toast fecha sem Desfazer** (ou ao sair da página).
- **Lixeira** (`/lancamentos/lixeira`, `status=DELETADO`): sem switch e sem Editar; ação **Restaurar** (`useRestaurarLancamento`) e o toast
  "Restaurado como inativo. Ative para voltar ao dashboard."
- Lançamento na lixeira não pode ser editado: em `/lancamentos/[id]/editar` mostrar o aviso e Restaurar.
- A exportação segue o filtro: só exporta itens da lixeira quando o filtro é a Lixeira.

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
  (as mutations de `hooks/use-mutacoes-lancamento.ts` já invalidam lista, dashboard e categorias). `taxaGasto` `null` → "Não disponível para o período".
- **RN006**: ATIVO/INATIVO alternam livremente; DELETADO só pode ser restaurado (volta INATIVO).
- **RN007**: após importar, resumo "X lançamentos importados, Y linhas ignoradas" + linha e motivo de cada falha + categorias criadas.
- **RN008**: gráficos de 4 meses, top 5 despesas e `pesoMaioresDespesas` vêm prontos da API; o front só renderiza.
- **RN010 / RNI003**: mostrar a `mensagem` da API (neutra). **Nunca** recomendar investimento.
- **RF005 / RN013**: filtros por descrição, mês, ano, tipo, status e categoria; a exportação usa os filtros ativos.
- **RN011**: `schemas/auth.schema.ts`: nome ≤ 150, e-mail válido ≤ 100, senha de 6 a 72 com confirmação, aceite da Política obrigatório.
- **RN012**: antes de enviar o CSV, checar no front se tem até 2 MB (a API também recusa acima de 5.000 linhas).
- **RN014**: na recuperação de senha, nunca dizer se o e-mail existe.
- **RN015**: foto JPG/PNG/WEBP até 2 MB (validar antes de enviar). E-mail não editável. Trocar a senha devolve token novo (Server Action troca o cookie).
- **RN016**: excluir conta → diálogo (digitar EXCLUIR + senha, oferecendo antes "Baixar meus dados") → Server Action → apagar o cookie → `/` com toast.
- **RNF006**: botão que envia dados fica **desabilitado com spinner** até a resposta (`<Button loading={isPending}>`). Lançamentos iguais são válidos.
- Mensagens claras, em português, sem termos técnicos (RNF007, RNF009, RNF010); nunca a mensagem crua da API.

## Contrato da API (espelho do CLAUDE.md do backend)

O navegador chama `/api/...` do **próprio Next**; o BFF repassa para `${API_URL}/api/...` com `Authorization: Bearer <token>`. JSON camelCase.
Login, cadastro, troca de senha e exclusão de conta passam por **Server Actions** (que chamam a API e gravam o cookie), não pelo BFF.
No código: tipos em `types/api.ts`, chamadas em `services/*.service.ts`, cache em `hooks/` e chaves em `constants/query-keys.ts`.

- `POST /auth/cadastro` `{nome, email, senha, aceiteTermos}` → `201` · e-mail já usado → `409`
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
- `GET /lancamentos/{id}` · `POST /lancamentos` · `PUT /lancamentos/{id}`, com body `{descricao, tipo, data: "2026-11-05", valor, categoriaIds}`
  (`data` ISO; o front mostra dd/mm/aaaa). Dia que não existe (`2026-02-31`) ou formato errado → `400` no campo `data`; fora de 2000–2100 → `422`.
- `PATCH /lancamentos/{id}/status {status: "ATIVO"|"INATIVO"}` (`422` se DELETADO) · `DELETE /lancamentos/{id}` → status DELETADO · `POST /lancamentos/{id}/restaurar` → volta INATIVO
- `POST /lancamentos/importar` multipart, campo `arquivo` → `{totalLinhas, importados, falhas: [{linha, conteudo, motivo}], categoriasCriadas}`
- `GET /lancamentos/exportar?formato=csv|xlsx&<filtros>` → arquivo (baixar como blob, nome vindo do `Content-Disposition`)
- `GET /lancamentos/template-csv` → arquivo
- `GET /dashboard?mes=&ano=` →
  `{mes, ano, receitas, despesas, saldo, taxaGasto|null, classificacaoTaxa: "DENTRO_DO_LIMITE"|"ATENCAO"|"ACIMA_DO_LIMITE"|null, mensagem, ultimosMeses: [{mes, ano, receitas, despesas, saldo}] (4), despesasPorCategoria: [{categoriaId, descricao, valor}], maioresDespesas: [{id, descricao, valor, categorias: string[]}], pesoMaioresDespesas: {valor, percentual|null}}`
  (`pesoMaioresDespesas`: soma das 5 maiores e % sobre as despesas do mês, 2 casas; `percentual` `null` sem despesa)

Lançamento: `{id, descricao, tipo: "RECEITA"|"DESPESA", data, valor, status: "ATIVO"|"INATIVO"|"DELETADO", categorias: [{id, descricao}], dataCadastro, dataAtualizacao, dataExclusao}`
(`data` = `"2026-11-05"`; `dataCadastro`/`dataAtualizacao`/`dataExclusao` = instantes ISO em UTC, ex. `"2026-08-03T09:30:15Z"`, mostrar no fuso local;
`dataExclusao` preenchida ao ir para a Lixeira e `null` ao restaurar).
Erro: `{status, mensagem, erros?: [{campo, mensagem}]}`. Exibir `mensagem` em toast e `erros` nos campos (`setError` do RHF).

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

## Testes

Guia detalhado: skill `testes-frontend`.

| Nível | Onde | Ferramentas | O que prova |
|---|---|---|---|
| **Unitário** | ao lado do arquivo (`format.test.ts`, `lancamento.schema.test.ts`) | Vitest | Formatação, datas, schemas Zod, utilitários, services |
| **Componente** | ao lado do componente (`money-text.test.tsx`) | Vitest + Testing Library + `user-event` | O que o usuário vê e faz **por props**; acessibilidade básica |
| **Hooks globais** | `hooks/*.test.tsx` | `renderHook` + `criarWrapper()` + MSW | Paginação, invalidação após mutations |
| **Integração da tela** | `screens/<Tela>/<Tela>View.test.tsx` | Provider + View + **MSW** (`renderComProviders`) | Carregando, vazio, erro, sucesso, ações e toasts |
| **End-to-end** | `e2e/*.spec.ts` | **Playwright** (Chromium e Firefox) | Fluxos completos sobre o build de produção |

- **E2E sem backend:** sessão pelo cookie `pm_token` (o `proxy.ts` só confere a presença) e API simulada no navegador com
  `page.route('**/api/**')` (`e2e/fixtures/`). Cobrir o roteiro da demo.
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

- Rodar o mesmo localmente: skill `pipeline-local`. Localmente o Playwright usa 3 workers (com mais, o Firefox estoura o tempo no WSL).
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

1. **Navegação provisória** (`organisms/navegacao-provisoria.tsx`): o B2 entrega `sidebar`, `bottom-nav`, `top-bar` e `create-sheet`;
   a `AppShellView` passa a usá-los e o arquivo provisório (com o teste) é apagado. O foco preso na sidebar aberta do tablet e o avatar
   ficam com esses organismos (o Esc e o véu já fecham pelo template). "Sair" precisa da `logoutAction` (ainda não existe em `actions/`).
2. **Mensagens do schema × DS:** `schemas/lancamento.schema.ts` usa "O valor deve ser maior que zero." e "Informe uma data que exista.";
   o DS (MoneyField/DatePicker) pede "Informe um valor maior que zero." e "Informe uma data válida, no formato dd/mm/aaaa.". O limite do
   valor também diverge (schema/CLAUDE.md R$ 999.999.999,99; README do MoneyField R$ 99.999.999.999.999,99). Decidir com a equipe e alinhar.
   Os componentes mostram o `error` que receberem; o DatePicker usa a mensagem do DS para texto inválido.
3. **Hooks que faltam:** importar CSV, exportar, baixar modelo, perfil (nome, foto, dados) e inativar/excluir categoria. Os services já existem;
   os hooks entram com as telas (B4) seguindo os de `hooks/use-mutacoes-lancamento.ts`.
4. **Telas placeholder** (Landing, Login, Cadastro, Dashboard): o B4 troca pelo conteúdo real (organismos, dados, estados e E2E do fluxo).
   Faltam as rotas de esqueci/redefinir senha, lançamentos, categorias, lixeira, perfil, privacidade, `not-found` e `error`.
5. **Tradução de erros em `lib/http`:** o DS pede que nenhuma tela mostre a mensagem crua da API (mapear status e `erros[]`). Hoje o
   `ErroApi` carrega a `mensagem` da API; a tradução entra com as primeiras telas que enviam dados.
6. `doc/IDEIAS_FUTURAS.md` (compartilhado com o back) ainda fala em `lib/http → services → hooks → organismos`; a cadeia agora termina no
   Context da tela. Atualizar nos dois repositórios juntos.
