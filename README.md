# PoupaMais — FrontEnd

Interface web do **PoupaMais**, aplicação de gestão financeira pessoal e familiar focada em letramento financeiro e na prevenção
do superendividamento (ODS 1 e 8). Projeto da disciplina de Laboratório de Engenharia de Software (LES) da Fatec Guarulhos.

**Equipe:** Bruno Sonoda · Leonardo Hideki · Leonardo Nascimento · Thalia Soares — **Orientação:** Prof. Jadir Custódio Júnior

A API (Spring Boot) fica em [LES-PoupaMais/PoupaMais_BackEnd](https://github.com/LES-PoupaMais/PoupaMais_BackEnd).

**No ar:** https://poupamais-one.vercel.app (instala como app no celular; ver [Deploy](#deploy)).

## Telas

- **Pública:** Landing page · Política de Privacidade.
- **Acesso:** Login · Criar conta · Esqueci a senha · Redefinir senha (link do e-mail).
- **Área logada:** Dashboard financeiro do mês · Lançamentos (busca, filtros, visualização, "Conta no saldo", mover para a
  lixeira com Desfazer, exportar em CSV/Excel) · Lixeira (restaurar) · Novo/Editar lançamento (com criação e edição de
  categorias no próprio campo) · Importar CSV (resumo das linhas ignoradas e download delas em CSV) · Categorias · Perfil (foto,
  senha, tema, baixar meus dados, excluir conta).
- **Gerais:** Página não encontrada (404) · Erro geral · Sem internet (faixa de aviso e consulta do que já foi aberto).

Todas as telas têm tema claro e escuro (segue o sistema; dá para escolher no Perfil) e funcionam no celular, no tablet e no
computador.

## Tecnologias

Next.js 16 (App Router, `cacheComponents`) · React 19 · TypeScript · Tailwind CSS 4 · **shadcn/ui** (sobre Radix UI) ·
next-themes · TanStack Query · React Hook Form + Zod · Recharts · lucide-react · sonner · PWA (manifest + service worker
próprio) · Vitest, Testing Library e MSW · Playwright · ESLint + Prettier · GitHub Actions

## Arquitetura

- **Rotas limpas → telas → componentes**: `src/app/` só tem as rotas (`page.tsx` monta o Provider e a View da tela). Cada tela
  fica numa pasta de `src/screens/<Tela>/`, com o **Context** (dados, estado, ações e toasts), a **View** (monta o template e os
  organismos) e o esqueleto de carregamento. Uma tela não importa outra.
- **Atomic Design + shadcn/ui**: `components/atoms` → `molecules` → `organisms` → `templates`. Os componentes são **puros** (só
  props). Os do shadcn **são os átomos** (`npx shadcn@latest add <nome>` grava em `components/atoms`). Um nível só importa o mesmo
  nível ou os de baixo; o ESLint (`eslint-plugin-boundaries`) garante as regras.
- **Arquivos** no padrão shadcn: kebab-case soltos na pasta do nível, com o teste ao lado (`atoms/button.tsx` + `button.test.tsx`,
  `organisms/transaction-table.tsx`). Em `screens/`, pastas e arquivos em PascalCase (`DashboardView.tsx`).
- **Dados**: `lib/http` → `services/` → `hooks/` (TanStack Query, cache de 5 min) → **Context da tela** → props dos organismos.
  Nenhum componente monta URL nem chama `fetch`. Depois de cada alteração, as consultas afetadas recarregam pelo mapa de
  `lib/invalidacoes.ts`.
- **Tema**: tokens do Design System nas variáveis CSS do shadcn (`src/styles/globals.css`). Claro e escuro em **todas** as telas,
  seguindo o sistema por padrão (classe `dark` no `<html>` pelo `next-themes`).
- **Rotas no App Router** com grupos: `(public)`, `(auth)` e `(app)` (área logada, protegida pelo `src/proxy.ts`). O mês escolhido
  fica na URL (`?mes=11&ano=2026`).
- **BFF**: o navegador chama só o próprio Next (`/api/*`), que repassa para a API com o token. O token JWT fica em cookie `httpOnly`,
  invisível para o JavaScript da página. Login, cadastro, troca de senha e exclusão de conta são Server Actions.
- **PWA**: `src/app/manifest.ts` e o service worker `public/sw.js` (ver "PWA" abaixo).

Regras detalhadas, contrato da API e decisões de design: [`CLAUDE.md`](CLAUDE.md).

## Como rodar

### Recomendado: tudo junto pelo PoupaMais_Development

O repositório [PoupaMais_Development](https://github.com/LES-PoupaMais/PoupaMais_Development) sobe banco, e-mail (Mailpit), API,
front e Nginx com um comando. Com os três repositórios lado a lado na mesma pasta:

```bash
cd ../PoupaMais_Development
npm run dev     # app em http://localhost:8000 (hot reload do front), painel em http://localhost:9000
npm run prod    # "como produção", em HTTPS: https://poupamais.localhost:8443
```

Detalhes (portas, certificado, abrir pelo celular) no README de lá.

### Só o front, com a API rodando à parte

Pré-requisitos: **Node pela `.nvmrc`** (`nvm use`) e a API no ar (README do backend: `docker compose up -d --build` lá).

```bash
nvm use                       # Node da .nvmrc
npm install
cp .env.example .env.local    # API_URL=http://localhost:8080 (só o servidor do Next lê; sem NEXT_PUBLIC_)
npm run dev                   # http://localhost:3000
```

Build de produção: `npm run build && npm run start` (também em http://localhost:3000).

## Testes

```bash
npm test                   # unitários e de componente (Vitest + Testing Library + MSW)
npm run test:coverage      # o mesmo, com piso de cobertura (o que o CI roda)
npm run test:e2e           # end-to-end com Playwright (Chromium e Firefox), com a API simulada
npm run test:e2e:api-real  # end-to-end contra a API real (Chromium), pela pilha E2E do PoupaMais_Development
```

Antes do primeiro E2E: `npx playwright install --with-deps chromium firefox`.
O `test:e2e` sobe o build de produção e simula a API no navegador (e uma API falsa para as Server Actions), então não precisa
do backend rodando.

### E2E contra a API real (`e2e/api-real/`)

Roda o roteiro da demo de ponta a ponta com o Spring, o Postgres e o Mailpit de verdade:

```bash
cd ../PoupaMais_Development && npm run e2e:up              # API 8580, Mailpit 8525, banco 5435 (127.0.0.1)
cd ../PoupaMais_FrontEnd && npm run test:e2e:api-real     # build de produção do Next em PORT=3130 (padrão)
cd ../PoupaMais_Development && npm run e2e:down            # o banco (tmpfs) some junto
```

Cada teste cria um usuário novo (e-mail único) e monta os dados pela API (`e2e/api-real/apoio/`), então não depende de ordem
nem de banco limpo. O "esqueci a senha" lê o link do e-mail pela API HTTP do Mailpit. Se a pilha não estiver de pé, a suíte
para logo com a instrução para subir. Firefox também: `npx playwright test -c playwright.api-real.config.ts --project=firefox`.
No CI ela roda no job "Testes contra a API real" (ver Pipeline).

## PWA

O PoupaMais instala como app no celular e no computador (ícone na tela inicial, janela própria). Sem internet, abre as telas já
visitadas e mostra os últimos dados guardados, só para consulta: gravar exige internet. Ao sair, os dados guardados são apagados.

- "Telas já visitadas" inclui as abertas por link interno (sem recarregar a página): a cada troca de tela, o app pede ao
  service worker (`screens/App/GuardarTelaOffline`) que guarde a página completa dessa tela da área logada, buscada em
  segundo plano. Sem internet, o Next faz a navegação completa e o service worker devolve a cópia; se não houver a do
  endereço exato, vale a da mesma tela com outro mês na URL.

- O service worker só é registrado no **build de produção** (`npm run build && npm run start`); no `npm run dev` não há.
- O navegador só oferece instalar em **HTTPS** ou em `localhost`. Pelo IP da rede (`http://192.168.x.x`) não instala. No
  celular, instale pelo site publicado (https://poupamais-one.vercel.app): Android/Chrome, menu ⋮ → _Instalar app_;
  iPhone/Safari, Compartilhar → _Adicionar à Tela de Início_. No computador, também pelo modo "como produção" do
  PoupaMais_Development (`https://poupamais.localhost:8443`, com a CA local confiada).
- Conferir: Chrome → DevTools → **Application** (Manifest e Service workers) e Lighthouse. Detalhes na seção "PWA" do
  [`CLAUDE.md`](CLAUDE.md).

## Deploy

| Peça                     | Onde                                        | Endereço                               |
| ------------------------ | ------------------------------------------- | -------------------------------------- |
| Front (este repositório) | **Vercel** (plano Hobby)                    | https://poupamais-one.vercel.app       |
| API                      | **Render** (Web Service Docker, plano Free) | https://poupamais-backend.onrender.com |
| Banco                    | **Neon** (Postgres 17, AWS US East)         | acessado só pela API                   |
| E-mail (redefinir senha) | **Brevo** (SMTP na porta 2525)              | —                                      |

- A Vercel publica a branch **`main`** a cada merge (as outras branches e os PRs ganham uma URL de prévia). A configuração é a
  padrão de Next.js (`npm run build`), com **uma** variável de ambiente: `API_URL=https://poupamais-backend.onrender.com` (sem
  barra no fim). Ela fica só no servidor da Vercel: o navegador fala com o próprio Next (BFF), que chama a API.
- Cabeçalhos de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) saem do
  `next.config.ts`; o HSTS é da Vercel.
- Saída `standalone` do Next só com `NEXT_OUTPUT=standalone` (a imagem Docker do modo "como produção" do
  PoupaMais_Development define, e fica com ~0,3 GB em vez de ~1,15 GB). Sem a variável, o build é o normal: o da Vercel e o
  do `npm run start` (o `next start` não serve a saída standalone).
- O plano Free do Render dorme depois de ~15 min sem uso, e a API leva de 2 a 3 min para acordar. Um job no
  [cron-job.org](https://cron-job.org) chama `GET /actuator/health` a cada 10 min para mantê-la acordada.
- Passo a passo completo (contas, variáveis de cada serviço e problemas comuns): seção "Deploy" do README do
  [PoupaMais_Development](https://github.com/LES-PoupaMais/PoupaMais_Development#deploy).

## Pipeline (CI)

O GitHub Actions (`.github/workflows/ci.yml`) roda em todo Pull Request e em push na `development` e na `main`:

1. **Lint, tipos, testes e build**: ESLint (com as regras do Atomic Design), Prettier, TypeScript, Vitest com piso de cobertura e build
   de produção.
2. **Testes end-to-end**: Playwright em Chromium e Firefox sobre o build de produção, com a API simulada.
3. **Testes contra a API real**: faz o checkout do `PoupaMais_BackEnd` e do `PoupaMais_Development` (branch `development`) em
   pastas irmãs, sobe a pilha E2E (`npm run e2e:up`: API, Postgres e Mailpit) e roda `npm run test:e2e:api-real` no Chromium.
   Se falhar, publica os logs da API e o relatório do Playwright.

PR só é integrado (na `development` ou na `main`) com o CI verde.

## Scripts

| Script                                  | O que faz                                     |
| --------------------------------------- | --------------------------------------------- |
| `dev` / `build` / `start`               | Desenvolvimento, build e servidor de produção |
| `lint` / `format` / `format:check`      | ESLint e Prettier                             |
| `typecheck`                             | Checagem de tipos                             |
| `test` / `test:watch` / `test:coverage` | Vitest                                        |
| `test:e2e`                              | Playwright (API simulada)                     |
| `test:e2e:api-real`                     | Playwright contra a API real (pilha E2E)      |

## Fluxo de branches (Gitflow)

```
feat/nome-do-card  ──PR──►  development  ──PR (release)──►  main
```

1. Crie a branch a partir da `development`: `git switch development && git pull && git switch -c feat/nome-do-card`.
2. Abra o Pull Request da `feat/...` para a `development`, nunca direto para a `main`.
3. O merge acontece com o CI verde e 1 aprovação.
4. Quando a `development` estiver estável para uma entrega, abra um PR da `development` para a `main`.

Ninguém faz commit direto na `development` nem na `main`. A `main` contém só versões entregáveis.

## Contribuindo

- Uma branch por card do Trello (`feat/<card>`, a partir da `development`), Conventional Commits (`feat(dashboard): ...`) e Pull
  Request para a `development`.
- Toda tela ou componente vem com testes. Rode `npm run lint`, `npm run typecheck` e `npm run test:coverage` antes do PR.
- Telas, design, regras de negócio e contrato da API: [`CLAUDE.md`](CLAUDE.md).

## Licença

[MIT](LICENSE)
