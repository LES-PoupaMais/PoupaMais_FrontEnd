# PoupaMais — FrontEnd

Interface web do **PoupaMais**, aplicação de gestão financeira pessoal e familiar focada em letramento financeiro e na prevenção
do superendividamento (ODS 1 e 8). Projeto da disciplina de Laboratório de Engenharia de Software (LES) da Fatec Guarulhos.

**Equipe:** Bruno Sonoda · Leonardo Hideki · Leonardo Nascimento · Thalia Soares — **Orientação:** Prof. Jadir Custódio Júnior

A API (Spring Boot) fica em [LES-PoupaMais/PoupaMais_BackEnd](https://github.com/LES-PoupaMais/PoupaMais_BackEnd).

## Telas

Landing page · Login · Criar conta · Esqueci/Redefinir senha · Dashboard financeiro · Lançamentos (filtros, lixeira, importação e
exportação) · Novo/Editar lançamento (com criação e edição de categorias no próprio campo) · Perfil · Política de Privacidade.

## Tecnologias

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · **shadcn/ui** (sobre Radix UI) · TanStack Query ·
React Hook Form + Zod · Recharts · lucide-react · Vitest, Testing Library e MSW · Playwright · ESLint + Prettier · GitHub Actions

## Arquitetura

- **Atomic Design + shadcn/ui**: `components/atoms` → `molecules` → `organisms` → `templates` → páginas em `app/`. Os componentes
  do shadcn **são os átomos** (`npx shadcn@latest add <nome>` grava em `components/atoms`). Um nível só importa o mesmo nível ou os
  de baixo; o ESLint (`eslint-plugin-boundaries`) garante a regra.
- **Arquivos** no padrão shadcn: kebab-case soltos na pasta do nível, com o teste ao lado (`atoms/button.tsx` + `button.test.tsx`,
  `organisms/lancamentos-table.tsx`).
- **Tema**: tokens do PoupaMais nas variáveis CSS do shadcn (`src/app/globals.css`); telas públicas e de autenticação no tema escuro
  (`.dark`), área logada no claro.
- **Rotas no App Router** com grupos: `(public)`, `(auth)` e `(app)` (área logada, protegida pelo `src/proxy.ts`).
- **BFF**: o navegador chama só o próprio Next (`/api/*`), que repassa para a API com o token. O token JWT fica em cookie `httpOnly`,
  invisível para o JavaScript da página.
- Dados: `lib/http` → `services/` → `hooks/` (TanStack Query) → organismos.

## Como rodar

Pré-requisitos: **Node pela `.nvmrc`** (`nvm use`) e a API rodando (ver o README do backend).

```bash
nvm use
npm install
cp .env.example .env.local    # API_URL=http://localhost:8080
npm run dev                   # http://localhost:3000
```

## Testes

```bash
npm test                 # unitários e de componente (Vitest + Testing Library + MSW)
npm run test:coverage    # o mesmo, com piso de cobertura
npm run test:e2e         # end-to-end com Playwright (Chromium e Firefox)
```

Antes do primeiro E2E: `npx playwright install --with-deps chromium firefox`.
Os testes E2E simulam a API no navegador, então não precisam do backend rodando.

## Pipeline (CI)

O GitHub Actions (`.github/workflows/ci.yml`) roda em todo Pull Request e em push na `development` e na `main`:

1. **Lint, tipos, testes e build**: ESLint (com as regras do Atomic Design), Prettier, TypeScript, Vitest com piso de cobertura e build
   de produção.
2. **Testes end-to-end**: Playwright em Chromium e Firefox sobre o build de produção.

PR só é integrado (na `development` ou na `main`) com o CI verde.

## Scripts

| Script                                  | O que faz                                     |
| --------------------------------------- | --------------------------------------------- |
| `dev` / `build` / `start`               | Desenvolvimento, build e servidor de produção |
| `lint` / `format` / `format:check`      | ESLint e Prettier                             |
| `typecheck`                             | Checagem de tipos                             |
| `test` / `test:watch` / `test:coverage` | Vitest                                        |
| `test:e2e`                              | Playwright                                    |

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
