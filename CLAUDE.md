# PoupaMais — FrontEnd (Web)

Aplicação web de gestão financeira pessoal e familiar (projeto de LES — Fatec Guarulhos, orientação Prof. Jadir Custódio Júnior).
O usuário registra **receitas e despesas** (lançamentos), organiza por **categorias**, importa/exporta em lote via **CSV/Excel**
e acompanha um **Dashboard** mensal. Foco: letramento financeiro e prevenção do superendividamento (ODS 1 e 8).
Web **responsiva** (usada também no navegador do celular); não há app nativo (RNI001).

Este repositório é **só o front**. A API (Java + Spring Boot + PostgreSQL + JWT) fica em `LES-PoupaMais/PoupaMais_BackEnd`.
O contrato está repetido abaixo; se mudar aqui, mude lá também.
Material de apoio fora do repo (pasta do workspace `../`): `../Documentação/DVP_PoupaMais_v1.md` (requisitos),
`../Documentação/DVP_PoupaMais_v1_imagens/` (prints das telas: image6 landing, image2 login, image3 cadastro,
image1 dashboard, image14 lançamentos, image5 novo lançamento), `../Imagens e Diagramas/Logos/` (logos).
Protótipo Figma Make: https://www.figma.com/make/eneZxdyYREP4zoDtQIxtwm/Controle-de-Finan%C3%A7as-Pessoais

## Estado atual (05/11/2026)

- **Scaffold pronto (06/11/2026):** Next.js 16.4 + React 19.3 + Tailwind 4 + shadcn/ui (Radix, estilo `radix-nova`), Vitest 5,
  Playwright 1.65, MSW 3. Pipeline local verde. As telas ainda são placeholders: landing, login, cadastro e dashboard.
- Leia também o `AGENTS.md` (gerado pelo Next): o Next 16 tem mudanças grandes; a documentação da versão instalada está em
  `node_modules/next/dist/docs/`. Consulte antes de usar API do Next que você não viu neste repo.
- **Decisão:** trocamos React + Vite por **Next.js (App Router)**. Os slides 8 e 9 da apresentação (`../Documentação/apresentacao.md`)
  já foram atualizados no `.md` (o Canva é ajustado à mão).
- Entregas: apresentação final **12–13/11/2026** (demo ao vivo); código no GitHub até **26/11/2026**.
- Card do Trello deste repo, **Desenvolver e Integrar Telas do Frontend**:
  1. Landing Page e fluxos de Login/Cadastro
  2. Dashboard com gráficos dinâmicos
  3. Listagem com filtros e Formulários
  4. Cliente HTTP com envio do token (aqui: BFF do Next + cookie httpOnly)
  Critério de aceite: páginas navegáveis, consumindo a API e refletindo dados reais do banco.
- Card de **Deploy**: front na Vercel com `API_URL` apontando para a API.

### Roteiro da demo (slide 12 da apresentação): o front precisa suportar exatamente isto

1. Criar uma categoria (pelo `+ Criar nova categoria` do dropdown) → 2. Cadastrar lançamento com **duas** categorias →
3. Importar CSV com uma linha inválida (mostrar quais linhas falharam) → 4. Filtrar e inativar um lançamento →
5. Ver o dashboard atualizado → 6. Exportar lançamentos.

## Stack

| Item          | Escolha |
| ------------- | ------- |
| Framework     | **Next.js 16 (App Router) + React 19 + TypeScript** (`src/`, alias `@/*`). `cacheComponents` ligado (ver Arquitetura) |
| Estilo        | Tailwind CSS 4 + **shadcn/ui** (componentes copiados para `components/atoms`, tema em variáveis CSS) + `cn()` (`@/lib/cn`, pacote oficial `cn` do shadcn) + `class-variance-authority` para variantes |
| Primitivos acessíveis | Radix UI (pacote `radix-ui`), por baixo dos átomos do shadcn (RNF012) |
| Dados remotos | TanStack Query (cache; invalidar dashboard e lista após mutações) |
| HTTP          | `fetch`/Axios no cliente apontando para o **BFF** do próprio Next (`/api/*`) |
| Formulários   | React Hook Form + Zod (`@hookform/resolvers`) |
| Gráficos      | Recharts (área: Receitas vs Despesas; donut: categorias; barras/linha: saldo mensal) |
| Ícones        | lucide-react (TrendingUp, TrendingDown, Wallet, AlertTriangle, LayoutGrid, List, PlusCircle, Pencil, Trash2, Filter, Download, Upload, Eye) |
| Toasts        | sonner |
| Fontes        | `next/font/google`: Outfit (títulos), DM Sans (corpo), JetBrains Mono (valores) |
| Qualidade     | ESLint (config do Next) + **eslint-plugin-boundaries** (regras do Atomic Design) + Prettier + `prettier-plugin-tailwindcss` |
| Testes        | **Vitest** + Testing Library + `user-event` + **MSW** (unitário/componente, cobertura v8) · **Playwright** (end-to-end) |

**Node:** nvm instalado na máquina, com Node 26 LTS como padrão. O repo tem `.nvmrc` (`26`): rode `nvm use` ao entrar na pasta.
O Node 18 do sistema continua lá, mas não use (o Next exige ≥ 20.9).

## Comandos

```bash
nvm use                 # Node da .nvmrc
npm run dev             # http://localhost:3000
npm run lint            # ESLint (inclui as regras do Atomic Design)
npm run format          # Prettier (format:check no CI)
npm run typecheck       # tsc --noEmit
npm test                # Vitest (unitário e componente)
npm run test:coverage   # Vitest + piso de cobertura (o que o CI roda)
npm run test:e2e        # Playwright (sobe o Next sozinho; navegadores: npx playwright install --with-deps chromium firefox)
npm run build           # build de produção
```

`.env.local` (variáveis **só do servidor**, sem `NEXT_PUBLIC_`; o navegador nunca vê a URL nem o token da API):

```
API_URL=http://localhost:8080
```

## Arquitetura

### Fluxo de autenticação e dados (BFF)

```
Navegador ──► Next (mesma origem)                                   ──► Spring API
             • Server Actions: login/cadastro/logout                     /api/auth/*
               → grava o JWT em cookie httpOnly `pm_token`
             • proxy.ts: rotas de (app) sem cookie → /login
             • app/api/[...path]/route.ts: repassa a chamada,            /api/*
               lendo o cookie e mandando `Authorization: Bearer`
```

- **Por quê:** o token não fica em `localStorage` (protegido contra XSS); não há CORS (tudo é mesma origem); a URL da API fica escondida.
- `src/proxy.ts` (no Next 16 o antigo `middleware.ts` virou `proxy.ts`): protege `/dashboard`, `/lancamentos/**` e `/perfil`
  e manda quem já está logado de `/login`/`/cadastro` para `/dashboard`.
- `app/api/[...path]/route.ts`: um único handler para GET/POST/PUT/PATCH/DELETE. Repassa query, body (inclusive multipart do
  import, com `duplex: 'half'`) e devolve status, corpo e headers (`Content-Type`, `Content-Disposition` para os downloads).
  Se a API responder 401, apaga o cookie e devolve 401; o cliente então redireciona para `/login`.
- `src/lib/session.ts` (`import 'server-only'`): `obterToken()`, `gravarSessao(token, expiraEm)`, `encerrarSessao()`; nome do cookie em `lib/sessao-cookie.ts`.
- **`cacheComponents` (Next 16) está ligado:** páginas e layouts viram estáticos por padrão. Componente de servidor que lê `cookies()`,
  `headers()` ou `searchParams` precisa ficar dentro de um `<Suspense>`; se não, o build falha. Route handlers (BFF) e Server Actions
  não têm essa restrição. Guia local: `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.

### Atomic Design

| Nível | Pasta | O que é | Pode importar | Exemplos |
| --- | --- | --- | --- | --- |
| **Átomos** | `components/atoms` | **Componentes do shadcn/ui** (+ átomos próprios no mesmo estilo). Sem regra de negócio e sem API | átomos, `lib/`, `types/` | `button` (com `success`, `xl` e `loading`), `input`, `label`, `card`, `badge`, `switch`, `dialog`, `dropdown-menu`, `select`, `checkbox`, `popover`, `command`, `field`, `sonner`, `skeleton`, `table`, `tooltip`, `avatar` (`AvatarUsuario`: foto ou inicial), `chart`; próprios: `money-text`, `logo` |
| **Moléculas** | `components/molecules` | Combinação de átomos, ainda genérica (sem domínio) | átomos, moléculas, `lib/`, `types/` | `form-field` (label+input+erro com `field`), `password-field`, `month-year-select`, `stat-card`, `confirm-dialog`, `empty-state`, `search-input`, `multi-select` (popover + command) |
| **Organismos** | `components/organisms` | Seções completas e de domínio; **únicos que usam hooks de dados** | átomos, moléculas, `hooks/`, `schemas/`, `types/`, `lib/` | `Navbar`, `UserMenu`, `LoginForm`, `CadastroForm`, `LancamentoForm`, `CategoriaMultiSelect`, `CategoriaModal`, `LancamentosTable`, `FiltrosLancamentos`, `ImportarDialog`, `ResultadoImportacao`, `ExportarMenu`, `ResumoCards`, `MensagemSaldo`, `ReceitasDespesasChart`, `DespesasCategoriaChart`, `SaldoMensalChart`, `MaioresDespesasList`, `HeroSection`, `FeaturesSection`, `BeneficiosSection` |
| **Templates** | `components/templates` | Esqueleto de página: grid, slots, fundo. Recebe `children`; não busca dados | átomos, moléculas, organismos de layout (`Navbar`) | `PublicTemplate` (escuro), `AuthTemplate` (card central escuro), `AppTemplate` (navbar escura + conteúdo claro), `DashboardTemplate` (grid dos cards e gráficos) |
| **Páginas** | `app/**/page.tsx` | Nível "páginas" do Atomic: monta template + organismos e lê `params`/`searchParams` | tudo acima | `/dashboard`, `/lancamentos`… |

Regras (o `eslint-plugin-boundaries` reclama se forem violadas, com a mensagem "Atomic Design: X não pode importar Y"):

- Um nível importa **o mesmo nível ou os de baixo**; nunca um nível acima. Páginas (`app/`) não importam `services/` direto.
- Átomos e moléculas **não conhecem o domínio** (não sabem o que é lançamento) e recebem tudo por props.
- Só organismos chamam `hooks/` (TanStack Query) ou Server Actions. Páginas e templates não chamam API diretamente.
- **Arquivos no padrão shadcn, em todos os níveis:** kebab-case soltos na pasta do nível, export nomeado em PascalCase e teste ao lado
  (`atoms/button.tsx` + `atoms/button.test.tsx`, `organisms/lancamentos-table.tsx` + `.test.tsx`). Sem pasta por componente e sem `index.ts`.
- **Novo átomo do shadcn:** `npx shadcn@latest add <nome>` (o `components.json` grava em `components/atoms`). Depois rode `npm run format`.
  - A CLI deste estilo gera `import { cn } from "cn"`: troque por `@/lib/cn` (mesmo pacote, import padronizado).
  - Se o componente trouxer um hook (ex.: `use-mobile`), mova-o para `lib/`: átomo não importa `hooks/`.
- **Átomo gerado não é editado sem motivo.** Se precisar (como `button`, `avatar`, `sonner`), marque cada alteração com `// PoupaMais:`,
  tire o arquivo da lista de exclusão de cobertura do `vitest.config.mts` e escreva o teste.
- Moléculas e organismos **compõem** átomos do shadcn; não recriam botão/input/dialog do zero. O visual do protótipo continua mandando:
  ajuste por `className`/variantes, não trocando de componente.
- Variantes via `cva`; cores só por token do tema (`bg-primary`, `bg-success`, `text-despesa`…), nunca hex.
- `'use client'` só onde há estado, efeito ou evento (a maioria dos organismos e alguns átomos). Templates e páginas ficam como Server Components.

### Estrutura de pastas

```
src/
├── app/
│   ├── layout.tsx                    # <html>, fontes (next/font), <Providers> (QueryClient + Toaster)
│   ├── providers.tsx                 # 'use client'
│   ├── not-found.tsx · error.tsx · loading.tsx
│   ├── (public)/
│   │   ├── layout.tsx                # PublicTemplate
│   │   ├── page.tsx                  # /  (landing)
│   │   └── privacidade/page.tsx      # /privacidade  (Política de Privacidade, RF015)
│   ├── (auth)/
│   │   ├── layout.tsx                # AuthTemplate
│   │   ├── login/page.tsx            # /login
│   │   ├── cadastro/page.tsx         # /cadastro
│   │   ├── esqueci-senha/page.tsx    # /esqueci-senha            (RF012)
│   │   └── redefinir-senha/page.tsx  # /redefinir-senha?token=…  (link do e-mail)
│   ├── (app)/                        # área logada, protegida pelo proxy.ts
│   │   ├── layout.tsx                # AppTemplate (Navbar)
│   │   ├── dashboard/page.tsx        # /dashboard?mes=8&ano=2026
│   │   ├── perfil/page.tsx           # /perfil  (RF013, RF014, RF016, RF017)
│   │   └── lancamentos/
│   │       ├── page.tsx              # /lancamentos?tipo=&status=&mes=…  (filtros na URL)
│   │       ├── novo/page.tsx         # /lancamentos/novo
│   │       └── [id]/editar/page.tsx  # /lancamentos/:id/editar
│   └── api/[...path]/route.ts        # BFF → Spring
├── proxy.ts                          # Next 16: substitui o middleware.ts
├── test/             setup.ts, utils.tsx (renderComProviders), msw/{handlers,server}.ts
├── components/
│   ├── atoms/        button.tsx, input.tsx, card.tsx… (shadcn) + testes ao lado
│   ├── molecules/    form-field.tsx, stat-card.tsx…
│   ├── organisms/    lancamentos-table.tsx, lancamento-form.tsx…
│   └── templates/    public-template.tsx, auth-template.tsx, app-template.tsx
├── actions/          auth.actions.ts            # Server Actions: loginAction, cadastroAction, logoutAction
├── services/         lancamentos.service.ts, categorias.service.ts, dashboard.service.ts, usuario.service.ts
│                     #  funções puras que chamam /api/* (BFF); sem React
├── hooks/            useLancamentos, useLancamento, useSalvarLancamento, useAlterarStatus, useImportarCsv,
│                     #  useExportar, useCategorias, useSalvarCategoria, useDashboard, useUsuario
├── schemas/          lancamento.schema.ts, categoria.schema.ts, auth.schema.ts   # Zod (RN001 etc.)
├── types/            api.ts                      # tipos espelhando os DTOs da API
├── constants/        meses.ts, query-keys.ts, rotas.ts
└── lib/              http.ts (cliente do BFF + tratamento do erro padrão), session.ts (server-only),
                      format.ts (moeda, período "Ago/2026", nome do mês), cn.ts, sessao-cookie.ts, download.ts
```

Na raiz: `components.json` (shadcn), `vitest.config.mts`, `playwright.config.ts`, `e2e/` (specs + `fixtures/`), `eslint.config.mjs`.

```
```

Camadas de dados (do mais baixo ao mais alto): `lib/http` → `services/` → `hooks/` → organismos.
Assim nenhum componente monta URL nem trata `fetch` diretamente.

**Filtros na URL** (`searchParams`): `/lancamentos?status=ATIVO&mes=8` e `/dashboard?mes=8&ano=2026`. Isso deixa
o link compartilhável, o botão Voltar funcionando, e a exportação usa os mesmos parâmetros.

## Telas (protótipo Figma: 6 telas; **não existe tela de categorias**)

| Rota | Tela | Conteúdo |
| --- | --- | --- |
| `/` | Landing (escura) | Header com logo + "Entrar" + "Criar conta". Badge "Controle financeiro pessoal", título "Pare de perder dinheiro **sem perceber.**" (parte em verde), subtítulo, CTA "Começar gratuitamente →" e "Já tenho conta". 3 cards: Dashboard inteligente, Controle total, Importação em lote. Seção "O que você ganha" com 4 itens com check. |
| `/login` | Login (escura) | Card "Bem-vindo de volta" / "Entre na sua conta para continuar." · E-MAIL, SENHA (olho para mostrar) · link **"Esqueci minha senha"** · botão verde "Entrar" · "Não tem conta? Criar conta". |
| `/cadastro` | Criar conta (escura) | "Criar conta" / "Comece a controlar suas finanças hoje." · NOME COMPLETO, E-MAIL, SENHA (mín. 6, olho), CONFIRMAR SENHA, checkbox obrigatório **"Li e aceito a Política de Privacidade"** (link para `/privacidade`) · botão "Criar conta" · "Já tem conta? Entrar". Após sucesso: logar direto e ir para `/dashboard`. |
| `/dashboard` | Dashboard Financeiro | Título + "Agosto 2026 — visão geral da sua saúde financeira" + **seletor de mês/ano** (padrão = atual). 4 cards: RECEITAS (verde), DESPESAS (vermelho), SALDO, TAXA DE GASTO (% + classificação). Faixa de mensagem do saldo. Gráfico de área "Receitas vs Despesas — últimos 4 meses", donut "Despesas por Categoria" com legenda, gráfico "Saldo Mensal" e lista "Maiores Despesas" (top 5). |
| `/lancamentos` | Lançamentos | Barra: botão "Filtros" + contador "30 lançamentos" · à direita "Exportar ▾" (CSV / Excel) e "Importar em lote ▾" (roxo; Importar arquivo / Baixar modelo CSV). Tabela: DESCRIÇÃO, PERÍODO (`Ago/2026`), CATEGORIAS (chips roxos), TIPO (badge RECEITA verde / DESPESA vermelho), VALOR (`+R$ 8.500,00` verde / `-R$ 680,00` vermelho, fonte mono), ATIVO (switch), AÇÕES (lápis, lixeira). Inativos aparecem esmaecidos. No celular, a tabela vira lista de cards. Ver "Lixeira" abaixo. |
| `/lancamentos/novo` e `/lancamentos/[id]/editar` | Novo / Editar Lançamento | "Registre uma receita ou despesa manualmente." · DESCRIÇÃO\*, TIPO\* (dois botões Receita/Despesa), MÊS\* (select com nomes), ANO\*, VALOR (R$)\* com máscara, CATEGORIA(S)\* multiselect (ver "Gestão de categorias") · "Limpar" e "Salvar lançamento" (roxo). |

| `/esqueci-senha` | Esqueci minha senha (escura) | E-MAIL · "Enviar link". Depois de enviar, mostrar **sempre** a mesma mensagem: "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha." (RN014) |
| `/redefinir-senha?token=` | Redefinir senha (escura) | NOVA SENHA + CONFIRMAR · ao concluir, toast e ir para `/login`. Token inválido ou expirado: mensagem + link para pedir de novo. |
| `/privacidade` | Política de Privacidade (pública) | Texto da política: dados coletados (nome, e-mail, senha com hash, foto opcional, lançamentos), finalidade, não compartilhamento, direitos do titular (acessar, corrigir, exportar, excluir) e como exercê-los no Perfil. |
| `/perfil` | Perfil (área logada) | Três blocos: **Dados pessoais** (Avatar grande + "Trocar foto"/"Remover foto", NOME editável, E-MAIL só leitura) · **Alterar senha** (SENHA ATUAL, NOVA, CONFIRMAR) · **Privacidade** ("Baixar meus dados" e "Excluir minha conta", em vermelho, com modal que pede a senha e explica que é irreversível). |

As telas de esqueci/redefinir senha, privacidade e perfil **não estão no protótipo**: seguir o visual das telas de auth (escuras) e de lançamentos (claras).

Navbar do app (escura): logo PoupaMais · Dashboard · Lançamentos · Novo Lançamento · à direita `Avatar` (foto ou inicial do nome) + nome + menu (**Meu perfil**, Sair).

**Avatar:** se `possuiFoto`, `<img src="/api/usuarios/me/foto?v={versão}">` (mude a versão após trocar a foto, para furar o cache); senão, círculo verde com a **primeira letra do nome** em maiúscula (como no protótipo: "U").

### Gestão de categorias (RF011 / UC009 / RN002): dentro do dropdown, sem tela própria

Toda a gestão de categorias acontece no **dropdown multiselect "CATEGORIA(S)"** (`CategoriaMultiSelect`) do formulário de lançamento:

- **Primeira opção do dropdown:** `+ Criar nova categoria` → abre o `CategoriaModal` com o campo descrição → `POST /categorias`.
  A categoria criada já entra selecionada no lançamento.
- **Cada categoria da lista** tem um **ícone de lápis** à direita → abre o mesmo `CategoriaModal` em modo edição (`PUT /categorias/{id}`).
  O clique no lápis não marca nem desmarca a categoria (`stopPropagation`).
- Inativar/reativar (`PATCH /categorias/{id}/status`): fica no modal de edição (sugestão; não está no protótipo).
  Categorias inativas aparecem no fim da lista, esmaecidas e não selecionáveis, mas com o lápis para reativar.
- Erros da API aparecem dentro do modal: `409` = "Já existe uma categoria com essa descrição" (comparação sem diferenciar maiúsculas/minúsculas).
- O filtro por categoria da tela de Lançamentos usa uma lista simples, sem criar nem editar.
- Depois de criar ou editar, invalidar as queries `categorias`, `lancamentos` e `dashboard` (os nomes aparecem nos chips e no gráfico).

### Lixeira e status (RN004 / RN006 / UC010)

- **Switch ATIVO**: alterna ATIVO⇄INATIVO (`PATCH /lancamentos/{id}/status`). Inativo continua na lista, esmaecido, e sai do dashboard.
- **Ícone de lixeira**: exclusão lógica, **sem modal**. A linha some na hora e aparece um toast "Lançamento excluído · **Desfazer**" (~5 s).
  A chamada `DELETE /lancamentos/{id}` **só é enviada quando o toast fecha sem Desfazer** (envie também se o usuário sair da página).
  Assim o Desfazer não passa pela API e a regra "restaurar volta como Inativo" continua valendo.
- **Filtro de status**: `Todos` (padrão = ATIVO + INATIVO) · `Ativos` · `Inativos` · `Lixeira` (`status=DELETADO`).
- **Na Lixeira**: as linhas aparecem sem switch e sem lápis; no lugar, um botão **Restaurar** (`POST /lancamentos/{id}/restaurar`)
  e o toast "Restaurado como inativo. Ative para voltar ao dashboard."
- Lançamento deletado **não pode ser editado**: se alguém abrir `/lancamentos/[id]/editar` de um deletado, mostrar aviso e o botão Restaurar.
- A exportação segue o filtro: só exporta deletados quando o filtro é Lixeira.

## Design (extraído dos prints do protótipo; conferir valores exatos no Figma)

Tokens em `src/app/globals.css`, sobre as variáveis do shadcn. Não usar cor "solta" em componente.

| Variável shadcn | Claro (`:root`, área logada) | Escuro (`.dark`, landing e auth) |
| --- | --- | --- |
| `--primary` | indigo-600 | indigo-500 |
| `--success` (nova) | emerald-600 | emerald-600 |
| `--destructive` | rose-600 | rose-500 |
| `--background` / `--card` | slate-50 / branco | slate-900 / slate-800 |
| `--border` | slate-200 | branco 10% |
| `--radius` | 0.75rem | 0.75rem |

Tokens de domínio: `text-receita`, `text-despesa` (+ `-fundo`), `text-categoria`/`bg-categoria-fundo`, `text-atencao`, `text-marca`.
Gráficos: `--chart-1` receita, `--chart-2` despesa, `--chart-3..5` categorias. O tema escuro vem da classe `dark` aplicada pelo
`PublicTemplate` e pelo `AuthTemplate`; o `AppTemplate` fica no claro.

- **Telas públicas** (landing/login/cadastro): fundo azul-marinho escuro (~`#0F172A`/slate-900), cards ~`#1E293B` com borda sutil,
  inputs escuros, labels em CAIXA ALTA pequenas e cinza.
- **Área logada**: navbar escura (`bg-sidebar`, slate-900); conteúdo em fundo claro (~`#F8FAFC`), cards brancos com borda `slate-200` e cantos arredondados (~12px).
- Cores: verde primário/receita `emerald-600 #059669` (botões das telas públicas, valores positivos);
  despesa `rose-600 #E11D48`; ação primária da área logada `indigo-600 #4F46E5` ("Importar em lote", "Salvar lançamento");
  chips de categoria roxo claro (`violet-100` fundo / `violet-700` texto); badge RECEITA `emerald-100/700`, DESPESA `rose-100/700`;
  faixa de mensagem: verde claro quando saldo ≥ 0, vermelho/âmbar claro quando negativo.
- Tipografia: títulos em sans geométrica bold (parece **Outfit**), corpo em **DM Sans**; **valores monetários em fonte monoespaçada** (átomo `MoneyText`).
- Logo: ícone de tendência (seta subindo, verde) + "PoupaMais". Arquivos em `../Imagens e Diagramas/Logos/` → copiar para `public/`.
- Taxa de gasto: cor por classificação: Dentro do limite (verde), Atenção (âmbar), Acima do limite (vermelho).

## Regras de negócio que afetam a UI

- **RN001**: validação do formulário (Zod em `schemas/`): descrição obrigatória (≤ 100), tipo, mês 1–12, ano 2000–2100, valor > 0, ≥ 1 categoria.
  Mostrar erro por campo; também exibir os `erros[]` vindos da API.
- **RN002**: multiselect de categorias (várias por lançamento); criar e editar pelo próprio dropdown via modal; categorias inativas não podem ser selecionadas.
- **RN003/RN004**: o dashboard só reflete lançamentos ATIVOS; após inativar/reativar, **invalidar a query do dashboard**.
  Se `taxaGasto` vier `null` (sem receitas), exibir "Não disponível para o período".
- **RN006**: ATIVO/INATIVO são editáveis e alternam livremente; DELETADO só pode ser restaurado (volta INATIVO). Ver "Lixeira e status".
- **RN007**: após importar, exibir resumo "X lançamentos importados, Y linhas com erro" + tabela das falhas (linha, motivo) e categorias criadas.
- **RN008**: gráficos de 4 meses e top 5 despesas vêm prontos da API; o front só renderiza.
- **RN010 / RNI003**: mostrar a `mensagem` da API. **Não** incluir recomendação de investimento:
  o protótipo diz "…Considere investir o excedente.", e esse trecho **deve sair** (viola RNI003).
- **RF005**: filtros por descrição, mês, ano, tipo, status (Todos/Ativos/Inativos/Lixeira) e categoria. A **exportação usa os filtros ativos** (RN013).
- **RN011**: cadastro com senha ≥ 6 e confirmação (Zod `refine`), e-mail válido, aceite da Política obrigatório.
- **RN014**: na recuperação, nunca dizer se o e-mail existe.
- **RN015**: foto JPG/PNG/WEBP até 2 MB (validar no front antes de enviar; a API valida de novo). E-mail não editável. Ao trocar a senha,
  a API devolve um token novo: a Server Action grava o cookie novo e a sessão continua.
- **RN016**: excluir conta → modal com senha → `POST /usuarios/me/excluir` → apagar o cookie → ir para `/` com toast "Conta excluída".
- **RN012**: antes de enviar o CSV, checar no front se tem até 2 MB (a API também recusa acima de 5.000 linhas).
- **RNF006**: todo botão que envia dados (salvar, importar, excluir conta…) fica **desabilitado com spinner** enquanto a requisição
  está em andamento (`isPending` do TanStack Query / `useFormStatus`). Não existe detecção de duplicata: lançamentos iguais são válidos.
- Mensagens de erro e sucesso claras, em português, sem termos técnicos (RNF007, RNF009, RNF010). Estados vazios:
  "Não há lançamentos cadastrados", "Não há informações disponíveis para o período".

## Contrato da API (espelho do CLAUDE.md do backend)

O navegador chama `/api/...` do **próprio Next**; o BFF repassa para `${API_URL}/api/...` com `Authorization: Bearer <token>`. JSON camelCase.
Login, cadastro, troca de senha e exclusão de conta passam por **Server Actions** (que chamam a API e gravam o cookie), não pelo BFF.

- `POST /auth/cadastro` `{nome, email, senha, aceiteTermos}` → `201` · e-mail já usado → `409`
- `POST /auth/recuperar-senha {email}` → `202` sempre · `POST /auth/redefinir-senha {token, novaSenha}` → `204` (`422` token inválido/expirado)
- `POST /auth/login` `{email, senha}` → `{token, expiraEm, usuario: {id, nome, email}}` · `401` credenciais inválidas
- `GET /usuarios/me` → `{id, nome, email, possuiFoto, dataCadastro}` · `PUT /usuarios/me {nome}`
- `PUT /usuarios/me/senha {senhaAtual, novaSenha}` → `{token, expiraEm}` (via Server Action, que troca o cookie) · `422` se a senha atual estiver errada
- `GET|PUT|DELETE /usuarios/me/foto` (PUT multipart, campo `foto`) · `GET /usuarios/me/dados` → JSON para download
- `POST /usuarios/me/excluir {senha}` → `204` (via Server Action, que apaga o cookie)
- `GET /categorias?ativa=` · `POST /categorias {descricao}` → `201 {id, descricao, ativa}` (`409` duplicada) · `PUT /categorias/{id}` · `PATCH /categorias/{id}/status {ativa}` · `DELETE /categorias/{id}` (`422` se vinculada)
  - `GET` vem em ordem alfabética (sem diferenciar maiúsculas); sem filtro, **ativas primeiro**. `PUT`/`PATCH` → `200 {id, descricao, ativa}`.
    Descrição: trim, obrigatória, ≤ 255 (`400` com `erros[]`); duplicada no `PUT` → `409`; categoria de outro usuário → `404`.
  - No lançamento: categoria inativa → `422`; inexistente/de outro usuário → `404`.
- Lista de lançamentos ordenada por ano desc, mês desc, id desc; `POST`/`PUT`/`PATCH`/`restaurar` devolvem o lançamento; `DELETE` de já deletado → `422`.
- `GET /lancamentos?descricao=&mes=&ano=&tipo=&status=&categoriaId=` (sem `status` = ATIVO + INATIVO; `status=DELETADO` = Lixeira)
- `GET /lancamentos/{id}` · `POST /lancamentos` · `PUT /lancamentos/{id}`, com body `{descricao, tipo, mes, ano, valor, categoriaIds}`
- `PATCH /lancamentos/{id}/status {status: "ATIVO"|"INATIVO"}` (`422` se DELETADO) · `DELETE /lancamentos/{id}` → status DELETADO · `POST /lancamentos/{id}/restaurar` → volta INATIVO
- `POST /lancamentos/importar` multipart, campo `arquivo` → `{totalLinhas, importados, falhas: [{linha, conteudo, motivo}], categoriasCriadas}`
- `GET /lancamentos/exportar?formato=csv|xlsx&<filtros>` → arquivo (baixar como blob, nome vindo do `Content-Disposition`)
- `GET /lancamentos/template-csv` → arquivo
- `GET /dashboard?mes=&ano=` →
  `{mes, ano, receitas, despesas, saldo, taxaGasto|null, classificacaoTaxa: "DENTRO_DO_LIMITE"|"ATENCAO"|"ACIMA_DO_LIMITE"|null, mensagem, ultimosMeses: [{mes, ano, receitas, despesas, saldo}] (4), despesasPorCategoria: [{categoriaId, descricao, valor}], maioresDespesas: [{id, descricao, valor, categorias: string[]}]}`

Lançamento: `{id, descricao, tipo: "RECEITA"|"DESPESA", mes, ano, valor, status: "ATIVO"|"INATIVO"|"DELETADO", categorias: [{id, descricao}], dataCadastro, dataAtualizacao}`
Erro: `{status, mensagem, erros?: [{campo, mensagem}]}`. Exibir `mensagem` em toast e `erros` nos campos (`setError` do RHF).

CSV de importação (RN012): separador `;`, cabeçalho `descricao;tipo;mes;ano;valor;categorias`, várias categorias separadas por `|`.

## Convenções

- Arquivos em kebab-case (`lancamentos-table.tsx`, `use-lancamentos.ts`), exports nomeados em PascalCase (componentes) e
  camelCase (`useLancamentos`); services `xxx.service.ts`; schemas `xxx.schema.ts`.
- Textos de interface em português; identificadores sem acento.
- Query keys centralizadas em `constants/query-keys.ts`, nunca string solta.
- Valores sempre formatados com `Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'})` (`lib/format.ts`); a API trabalha com número decimal.
- Nada de token em `localStorage`; a sessão é só o cookie httpOnly.
- Responsivo mobile-first; contraste e legibilidade adequados (RNF012); testar em Chrome, Edge e Firefox (RNF016).
- Enquanto a API não estiver pronta, os `services/` podem devolver mocks (dados do protótipo: Salário mensal 8.500, Freelance 1.200,
  Aluguel 2.100, Supermercado 680, iFood 420…). Os componentes não mudam quando o mock sai.
- Toda tela ou componente nasce **com testes** (ver "Testes"). Sem teste, não está pronto.
- **Git (Gitflow):** `feat/<card>` criada a partir da `development` → PR para a `development` → quando estável para entrega, PR
  `development` → `main`. Nunca PR de `feat/*` direto para a `main` e nunca commit direto na `development` ou na `main`.
  Conventional Commits (`feat(dashboard): ...`).

## Testes

Guia detalhado: skill `testes-frontend`.

| Nível | Onde | Ferramentas | O que prova |
|---|---|---|---|
| **Unitário** | ao lado do arquivo (`format.test.ts`, `lancamento.schema.test.ts`) | Vitest | Formatação, schemas Zod (RN001, RN011…), utilitários |
| **Componente** | ao lado do componente (`Button.test.tsx`) | Vitest + Testing Library + `user-event` | O que o usuário vê e faz; acessibilidade básica (papéis e rótulos) |
| **Integração do front** | ao lado do organismo | + **MSW** simulando o BFF `/api/*` | Organismo + hook + service juntos: carregando, vazio, erro, sucesso, invalidação de cache |
| **End-to-end (automatizado)** | `e2e/*.spec.ts` | **Playwright** (Chromium e Firefox, RNF016) | Fluxos completos no navegador sobre o build de produção |

- **E2E sem backend:** a sessão é criada com o cookie `pm_token` (o `proxy.ts` só confere a presença) e a API é simulada no navegador com
  `page.route('**/api/**')` usando `e2e/fixtures/`. Cobrir no mínimo o roteiro da demo (categoria pelo dropdown, lançamento com duas
  categorias, CSV com linha inválida, filtro + inativar, lixeira + restaurar, dashboard por mês, exportar).
- **Cobertura (Vitest v8)**: `npm run test:coverage` falha abaixo dos pisos de `vitest.config.mts`: **80% de linhas, funções e statements,
  70% de branches** no início (o Previna usa 95/92; subimos junto com a cobertura). Fora da conta: os átomos do shadcn **sem lógica nossa** (lista no `vitest.config.mts`), `app/**` (páginas finas, cobertas pelo E2E),
  `src/test/**` e arquivos `.d.ts`.

## Pipeline (CI: GitHub Actions)

Arquivo: `.github/workflows/ci.yml` (mesmo desenho da pipeline do Previna, adaptado; com um job de E2E a mais).

- **Quando roda:** push na `development` e na `main`, e todo Pull Request; um push novo no mesmo PR cancela a execução anterior. Permissões só de leitura.
- Node pela `.nvmrc` (`node-version-file`), com cache do npm.

| Job | Passos | Reprova se |
|---|---|---|
| `qualidade` (Lint, tipos, testes e build) | `npm ci` · `lint` · `format:check` · `typecheck` · `test:coverage` · `build` · publica `coverage/` | erro de lint/Atomic Design, formatação, tipo, teste, cobertura abaixo do piso ou build quebrado |
| `e2e` (Testes end-to-end), depois de `qualidade` | `npm ci` · `npx playwright install --with-deps chromium firefox` · `npm run test:e2e` · publica `playwright-report/` se falhar | qualquer fluxo E2E quebrado |

- Rodar o mesmo localmente: skill `pipeline-local`.
- **Regra da equipe:** PR só é integrado com o CI verde. Proteção da `development` **e** da `main` no GitHub exigindo os checks
  "Lint, tipos, testes e build" e "Testes end-to-end", com 1 aprovação.
- Futuro (card de Deploy): preview da Vercel por PR e deploy de produção após o merge.

## Claude Code: skills e plugins

Skills do repo (`.claude/skills/`), usadas automaticamente pelo Claude quando o assunto aparece:

| Skill | Quando |
|---|---|
| `componente-atomic` | Criar ou alterar componente (nível do Atomic Design, pasta, imports, teste) |
| `tela-next` | Criar ou alterar uma tela/rota (service, hook, schema, organismos, page, E2E) |
| `testes-frontend` | Escrever ou corrigir testes (Vitest, MSW, Playwright); cobertura reprovando |
| `pipeline-local` | Antes de dizer "pronto", commitar ou abrir PR; CI falhou |
| `mudanca-de-regra` (na raiz do workspace) | O pedido contradiz o DVP ou o contrato |

Plugins oficiais recomendados (instalar com `/plugin`): `frontend-design` (só para telas fora do protótipo), `playwright` (navegar na app e depurar E2E), `feature-dev`, `pr-review-toolkit`, `commit-commands`, `security-guidance`, `context7` (documentação atualizada de Next/React/Tailwind).

## Direção futura (ideias a discutir)

Leia `doc/IDEIAS_FUTURAS.md` antes de propor funcionalidade nova ou mudar o visual: são ideias em aberto, levantadas com base em
projetos acadêmicos antigos, para a equipe discutir. Este `CLAUDE.md` é a fonte da verdade do escopo atual (os `.md` do DVP são uma
versão anterior). O design será refeito em conjunto (mobile-first, responsivo). Nada disso é para implementar sem decisão da equipe.

## Pontos em aberto

1. O gráfico "Saldo Mensal" não aparece no print do dashboard (fica abaixo da dobra); conferir no Figma.
